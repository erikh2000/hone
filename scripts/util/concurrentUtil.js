export async function executeTasksWithMaxConcurrency(taskFunctionArray, maxConcurrency) {
  let remainingToCompleteCount = taskFunctionArray.length;
  const taskFunctions = [...taskFunctionArray];
  return new Promise((resolve, reject) => {
    function _startNextTask(taskFunction) {
      taskFunction().then(() => {
        if (--remainingToCompleteCount === 0) { resolve(); return; }
        if (taskFunctions.length) _startNextTask(taskFunctions.pop());
      }).catch((err) => reject(err)); 
    }
    
    // Start first batch of concurrent tasks.
    const firstBatchCount = Math.min(maxConcurrency, taskFunctionArray.length);
    for(let i = 0; i < firstBatchCount; ++i) { 
      const taskFunction = taskFunctions.pop();
      _startNextTask(taskFunction); 
    }
  }).catch((err) => { throw err; });
}