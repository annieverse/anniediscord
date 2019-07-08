`use strict`;

const sql = require(`sqlite`);
sql.open(`.data/database.sqlite`)
/**
    Parse raw_object (also referenced as container)
    @filtering_items
*/
async function filtering_items(container) {
    let bag = {},
        parsedbag = {},
        raritybag = {},
        msg = "";

    delete container.userId;

    //  Check whether the container is empty or filled.
    const empty_bag = async () => {
        for (let i in container) {
            if (container[i] !== null || container[i] > 0) return false;
        }
        return true;
    }


    //  Register all properties and values from container to be used in variable bag
    const assigning_items = async () => {
        for (let i in container) {
            if (i) {
                bag[i] = container[i]
            }
        }
    }


    //  Remove property that contain null values from an object
    const eliminate_nulls = async () => {
        for (let i in bag) {
            if (bag[i] === null || bag[i] === undefined || bag[i] < 1) {
                delete bag[i]
            }
        }
    }




    // Label each item from itemlist
    const name_labeling = async () => {
        for (let i in bag) {
            sql.get(`SELECT name FROM itemlist WHERE alias = "${i}"`)
                .then(async data => parsedbag[data.name] = bag[i])
        }
    }


    // Store rarity of the item.
    const get_rarities = async () => {
        for (let i in bag) {
            sql.get(`SELECT rarity FROM itemlist WHERE alias = "${i}"`)
                .then(async data => raritybag[i] = data.rarity)
        }
    }




    //  Sorting object in a descending order.
    const sort_order = async (obj, saveopt, sortopt = {}) => {
        let temp_array = [],
            sorted_obj = {};

        // Push into an array with sub array.
        for (let i in obj) {
            temp_array.push([
                [i], sortopt[i]
            ]);
        }

        // Sort.
        temp_array.sort((a, b) => b[1] - a[1]);


        // Reassign to object form
        for (let i in temp_array) {
            sorted_obj[temp_array[i][0]] = obj[temp_array[i][0]];
        }

        return saveopt < 1 ? bag = sorted_obj : parsedbag = sorted_obj;
    }




    // Parse & prettify items object so it can be displayed to the user.
    const formatting = async () => {
        for (let i in parsedbag) {
            msg += `[${parsedbag[i]}x] ${i}\n`;
        }
        msg = `\`\`\`json\n${msg}\n\`\`\``;
    }


    if (empty_bag()) filter_res = null;

    // Cleaning the bag.
    await assigning_items();
    await eliminate_nulls();
    await name_labeling();
    await get_rarities();


    // Sorted and properly formatted.
    await sort_order(bag, 0, raritybag);
    await sort_order(parsedbag, 1, raritybag);
    await formatting();


    return {
        filter_res: msg,
        filter_alias_res: bag,
        filter_rarity_res: raritybag
    }
}

module.exports = filtering_items