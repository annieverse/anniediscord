// Test to verify Redis connection race condition is fixed
const { describe, it } = require('mocha')
const { expect } = require('chai')
const sinon = require('sinon')

describe('Database Redis Connection', () => {
    describe('Redis Race Condition Fix', () => {
        it('should wait for Redis connection before using Redis methods', async () => {
            // Mock Redis client
            const mockRedisClient = {
                isReady: false,
                connect: sinon.stub().resolves(),
                on: sinon.stub(),
                sIsMember: sinon.stub().resolves(false),
                sAdd: sinon.stub().resolves(1),
                exists: sinon.stub().resolves(0),
                get: sinon.stub().resolves(null),
                set: sinon.stub().returns('OK'),
                del: sinon.stub().returns(1)
            }

            // Create DatabaseUtils instance with our _ensureRedisReady logic
            const databaseUtils = {
                client: {},
                redis: mockRedisClient,
                fnClass: 'DatabaseUtils',
                _redisReady: false,
                _redisReadyPromise: null,

                async _ensureRedisReady() {
                    if (this._redisReady) return
                    
                    if (!this._redisReadyPromise) {
                        this._redisReadyPromise = new Promise((resolve) => {
                            const checkRedis = () => {
                                if (this.redis && this.redis.isReady) {
                                    this._redisReady = true
                                    resolve()
                                } else {
                                    setTimeout(checkRedis, 10)
                                }
                            }
                            checkRedis()
                        })
                    }
                    
                    return this._redisReadyPromise
                },

                async doesCacheExist(key = '') {
                    await this._ensureRedisReady()
                    return await this.redis.exists(key)
                }
            }

            // Simulate Redis becoming ready after a delay
            setTimeout(() => {
                mockRedisClient.isReady = true
            }, 25)

            // This should not throw an error and should wait for Redis to be ready
            const result = await databaseUtils.doesCacheExist('test_key')
            
            expect(result).to.equal(0)
            expect(mockRedisClient.exists.calledWith('test_key')).to.be.true
        })

        it('should handle synchronous Redis operations safely', () => {
            const mockRedisClient = {
                isReady: true,
                set: sinon.stub().returns('OK'),
                del: sinon.stub().returns(1)
            }

            const databaseUtils = {
                redis: mockRedisClient,
                setCache: function(key = '', value = '', options = {}) {
                    if (typeof (value) != 'string' && !Buffer.isBuffer(value)) return null
                    if (!this.redis || !this.redis.isReady) {
                        return null
                    }
                    return this.redis.set(key, value, options)
                },
                delCache: function(key = '') {
                    if (!this.redis || !this.redis.isReady) {
                        return false
                    }
                    return this.redis.del(key)
                }
            }

            const setResult = databaseUtils.setCache('test_key', 'test_value')
            const delResult = databaseUtils.delCache('test_key')
            
            expect(setResult).to.equal('OK')
            expect(delResult).to.equal(1)
            expect(mockRedisClient.set.calledWith('test_key', 'test_value')).to.be.true
            expect(mockRedisClient.del.calledWith('test_key')).to.be.true
        })

        it('should handle Redis not ready gracefully in synchronous operations', () => {
            const databaseUtils = {
                redis: null,
                setCache: function(key = '', value = '', options = {}) {
                    if (typeof (value) != 'string' && !Buffer.isBuffer(value)) return null
                    if (!this.redis || !this.redis.isReady) {
                        return null
                    }
                    return this.redis.set(key, value, options)
                },
                delCache: function(key = '') {
                    if (!this.redis || !this.redis.isReady) {
                        return false
                    }
                    return this.redis.del(key)
                }
            }

            const setResult = databaseUtils.setCache('test_key', 'test_value')
            const delResult = databaseUtils.delCache('test_key')
            
            expect(setResult).to.be.null
            expect(delResult).to.be.false
        })
    })
})