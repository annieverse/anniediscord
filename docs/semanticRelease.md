# Plugins

## Official plugins

* [@semantic-release/commit-analyzer](https://github.com/semantic-release/commit-analyzer)
  * $\text{\textcolor{yellow}{**Note**: this is already part of semantic-release and does not have to be installed separately}}$
  * `analyzeCommits`: Determine the type of release by analyzing commits with [conventional-changelog](https://github.com/conventional-changelog/conventional-changelog)
* [@semantic-release/release-notes-generator](https://github.com/semantic-release/release-notes-generator)
  * $\text{\textcolor{yellow}{**Note**: this is already part of semantic-release and does not have to be installed separately}}$
  * `generateNotes`: Generate release notes for the commits added since the last release with [conventional-changelog](https://github.com/conventional-changelog/conventional-changelog)
* [@semantic-release/github](https://github.com/semantic-release/github)
  * $\text{\textcolor{yellow}{**Note**: this is already part of semantic-release and does not have to be installed separately}}$
  * `verifyConditions`: Verify the presence and the validity of the GitHub authentication and release configuration
  * `publish`: Publish a [GitHub release](https://help.github.com/articles/about-releases)
  * `success`: Add a comment to GitHub issues and pull requests resolved in the release
  * `fail`: Open a GitHub issue when a release fails
* [@semantic-release/npm](https://github.com/semantic-release/npm)
  * $\text{\textcolor{yellow}{**Note**: this is already part of semantic-release and does not have to be installed separately}}$
  * `verifyConditions`: Verify the presence and the validity of the npm authentication and release configuration
  * `prepare`: Update the package.json version and create the npm package tarball
  * `publish`: Publish the package on the npm registry
* [@semantic-release/gitlab](https://github.com/semantic-release/gitlab)
  * `verifyConditions`: Verify the presence and the validity of the GitLab authentication and release configuration
  * `publish`: Publish a [GitLab release](https://docs.gitlab.com/ee/user/project/releases/)
* [@semantic-release/git](https://github.com/semantic-release/git)
  * `verifyConditions`: Verify the presence and the validity of the Git authentication and release configuration
  * `prepare`: Push a release commit and tag, including configurable files
* [@semantic-release/changelog](https://github.com/semantic-release/changelog)
  * `verifyConditions`: Verify the presence and the validity of the configuration
  * `prepare`: Create or update the changelog file in the local project repository
* [@semantic-release/exec](https://github.com/semantic-release/exec)
  * `verifyConditions`: Execute a shell command to verify if the release should happen
  * `analyzeCommits`: Execute a shell command to determine the type of release
  * `verifyRelease`: Execute a shell command to verifying a release that was determined before and is about to be published
  * `generateNotes`: Execute a shell command to generate the release note
  * `prepare`: Execute a shell command to prepare the release
  * `publish`: Execute a shell command to publish the release
  * `success`: Execute a shell command to notify of a new release
  * `fail`: Execute a shell command to notify of a failed release
* [@semantic-release/apm](https://github.com/semantic-release/apm)
  * `verifyConditions`: Verify the presence of the `ATOM_ACCESS_TOKEN` environment variable and the [`apm`](https://github.com/atom/apm) CLI
  * `prepare`: Update the `package.json` version with [`npm version`](https://docs.npmjs.com/cli/version)
  * `publish`: Publish the [Atom package](https://flight-manual.atom.io/hacking-atom/sections/publishing)

## [Documentation](https://semantic-release.gitbook.io/semantic-release/extending/plugins-list)


@semantic-release/changelog @semantic-release/commit-analyzer @semantic-release/git @semantic-release/release-notes-generator