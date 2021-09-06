#!/usr/bin/env zx

$.verbose = false;
process.stdin.isTTY = false;

const [runtime, runner, script, ...args] = process.argv;
const [branch] = args;
const delimiter = '	';
const limit = 10;

const currentBranch = branch ?? (await $`git branch --show-current`).stdout.trim();
console.log(chalk.cyan(`Got current branch: ${currentBranch}`));

const runs = (await $`gh run list --limit ${limit}`).stdout
    .split('\n')
    .filter((line) => line.length > 0)
    .map((run) => {
        const [status, result, name, workflow, branch, event, id, elapsed, age] = run.split(delimiter);
        return {
            status,
            result,
            name, 
            workflow,
            branch,
            event,
            id,
            elapsed,
            age
        }
    });

const branchRun = runs.find((run) => run.branch === currentBranch);
if (!branchRun) {
    console.log(chalk.red(`Found no runs related to branch ${currentBranch} in the last ${limit} runs.`));
    process.exit(1);
}
await $`gh run view ${branchRun.id} -w`;
