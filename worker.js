import Queue from "bull/lib/queue";

const fileQueue = new Queue('file queue');

fileQueue.process(async (job, done) => {
  console.log(job)
  

})


module.exports = fileQueue;
