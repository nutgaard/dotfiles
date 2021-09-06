#!/usr/bin/env zx

$.verbose = false;
process.stdin.isTTY = false;

const prFields = ['id', 'number', 'author', 'state', 'baseRefName', 'headRefName', 'mergeable', 'reviews', 'title', 'body', 'commits']
    .join(',');
const prs = JSON.parse((await $`gh pr list --json ${prFields}`).stdout);
console.log(chalk.cyan(`Found ${prs.length} PRs in repository.`));

const prToMaster = prs.filter((pr) => pr.baseRefName === 'master');
if (prToMaster.length > 0) {
    console.log(chalk.red('Already an PR created to master...'));
    process.exit(1);
} else {
    console.log(chalk.green('No PR to master yet. Finding diff between dev and master'));
}

await $`git fetch origin`;
const commitsResult = await $`git log origin/master..origin/dev --oneline`;
const commits = commitsResult.stdout
    .split('\n')
    .filter((line) => line.length > 0)
    .filter((line) => !line.includes('Merge pull request #'))
    .map((line) => `- ${line}`);

console.log(chalk.cyan('Commits:'));
commits.forEach((line) => console.log(line));

const tmpFileName = 'xxxx-xxxx-xxxx-xxxx'.replace(/x/g, () => Math.round(36 * Math.random()).toString(36));
const titleInput = await question('Title: ');
const title = `[PROD] ${titleInput}`;
const tmpFile = `${tmpFileName}.txt`;
await fs.writeFile(tmpFile, commits.join('\n'));

const newPrResult = await nothrow($`gh pr create --title ${title} --body-file ${tmpFile} --head dev --base master`);
await fs.unlink(tmpFile);
if (newPrResult.exitCode !== 0) {
    console.log(chalk.red(newPrResult.stderr));
    process.exit(newPrResult.exitCode);
}
console.log(chalk.green(`Created new PR from 'dev' into 'body'`));

console.log(chalk.cyan(`Opening new PR`));
const newPr = newPrResult.stdout.trim();
await $`gh pr view ${newPr} -w`;