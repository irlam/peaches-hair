async function start() {
  await import("./server.js");
}

start().catch((error) => {
  console.error("Unable to start Peaches Hair:", error);
  process.exitCode = 1;
});
