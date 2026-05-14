import { v4 as uuid } from 'uuid';
const tunnelId = uuid().slice(0, 6);
console.log(tunnelId);