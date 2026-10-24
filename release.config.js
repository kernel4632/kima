/* main is the release source; versions are derived from Conventional Commits. */
export default {
  branches: ['main'],
  tagFormat: 'v${version}',
  plugins: [
    ['@semantic-release/commit-analyzer', {
      releaseRules: [
        { breaking: true, release: 'major' },
        { type: 'docs', release: 'patch' },
        { type: 'refactor', release: 'patch' },
        { type: 'build', release: 'patch' },
        { type: 'chore', release: 'patch' },
        { type: 'test', release: 'patch' },
        { type: 'ci', release: 'patch' },
      ],
    }],
    '@semantic-release/release-notes-generator',
    '@semantic-release/npm',
    ['@semantic-release/git', {
      assets: ['package.json'],
      message: 'chore(release): 发布 ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
    }],
    ['@semantic-release/github', { successComment: false, failComment: false, releasedLabels: false }],
  ],
};
