export async function wait(msecs:number):Promise<void> {
  return new Promise(resolve => setTimeout(resolve, msecs));
}