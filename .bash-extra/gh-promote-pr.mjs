#!/usr/bin/env zx

$.verbose = false;
process.stdin.isTTY = false;

const [runtime, runner, script, ...args] = process.argv;
const [branch] = args;

const currentBranch = branch ?? (await $`git branch --show-current`).stdout.trim();
console.log(chalk.cyan(`Got current branch: ${currentBranch}`));
if (currentBranch === 'dev') {
    console.log(chalk.red(`Cannot promote PR from dev-branch...`));
    process.exit(1);
}

const prFields = ['id', 'number', 'author', 'state', 'baseRefName', 'headRefName', 'mergeable', 'reviews', 'title', 'body', 'commits']
    .join(',');
const prs = JSON.parse((await $`gh pr list --json ${prFields}`).stdout);
console.log(chalk.cyan(`Found ${prs.length} PRs in repository.`));

const prToMaster = prs.filter((pr) => pr.baseRefName === 'master');
if (prToMaster.length > 0) {
    console.log(chalk.red('Already an PR created to master...'));
    process.exit(1);
}

const prFromCurrentToDev = prs.filter((pr) => pr.baseRefName === 'dev' && pr.headRefName === currentBranch);
if (prFromCurrentToDev.length === 0) {
    console.log(chalk.red(`Found no PR from '${currentBranch}' to 'dev'...`));
    process.exit(1);
}

const candicatePr = prFromCurrentToDev[0];
console.log(chalk.cyan(`Chose: #${candicatePr.number} ${candicatePr.title}`));

if (candicatePr.mergeable !== 'MERGEABLE') {
    console.log(chalk.red(`PR has status '${candicatePr.mergeable}', and cannot be merged without manual intervention...`));
    process.exit(1);
}
const hasApproval = candicatePr.reviews.some((review) => review.state === 'APPROVED')
const shouldContinue = hasApproval || ((await question('PR has no approval reviews, continue? [yN] ')) == 'y');

if (!shouldContinue) {
    console.log(chalk.red(`PR has no approval reviews. Stopped...`));
    process.exit(1);
}

console.log(chalk.cyan(`Merging #${candicatePr.number} from ${candicatePr.headRefName} into ${candicatePr.baseRefName}`));
let mergeResult = await nothrow($`gh pr merge ${candicatePr.number} --merge --delete-branch`);
if (mergeResult.exitCode !== 0) {
    console.log(chalk.red(mergeResult.stderr));
    if (mergeResult.exitCode === 1 && mergeResult.stderr.includes("use administrator privileges")) {
        const useAdmin = ((await question('Use administrator privileges? [yN] ')) == 'y')
        if (useAdmin) {
            mergeResult = await nothrow($`gh pr merge ${candicatePr.number} --merge --delete-branch --admin`);
        } else {
            process.exit(mergeResult.exitCode);
        }
    } else {
        process.exit(mergeResult.exitCode);
    }
}
console.log(chalk.green(`Merged #${candicatePr.number} from ${candicatePr.headRefName} into ${candicatePr.baseRefName}`));

console.log(chalk.cyan(`Fetching new merged branch (dev)`));
await $`git pull`;
console.log(chalk.cyan(`Fetched new merged branch (dev)`));

console.log(chalk.cyan(`Creating new PR from 'dev' into 'master'`));
const tmpFileName = 'xxxx-xxxx-xxxx-xxxx'.replace(/x/g, () => Math.round(36 * Math.random()).toString(36));
const tmpFile = `${tmpFileName}.txt`;
await fs.writeFile(tmpFile, candicatePr.body);
const title = `[PROD]${candicatePr.title}`;
const newPrResult = await nothrow($`gh pr create --title ${title} --body-file ${tmpFile} --head dev --base master`);
await fs.unlink(tmpFile);
if (newPrResult.exitCode !== 0) {
    console.log(chalk.red(newPrResult.stderr));
    process.exit(newPrResult.exitCode);
}
console.log(chalk.green(`Created new PR from 'dev' into 'master'`));

console.log(chalk.cyan(`Opening new PR`));
const newPr = newPrResult.stdout.trim();
await $`gh pr view ${newPr} -w`;
