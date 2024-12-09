function isIpAddress(hostName:string):boolean {
  return hostName.match(/^\d+\.\d+\.\d+\.\d+$/g) !== null;
}

export function isServingLocally() {
  const hostName = window.location.hostname;
  return hostName === "localhost" || isIpAddress(hostName);
}