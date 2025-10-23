import WebSocket, { WebSocketServer } from "ws";

// This will be imported after the server is created in index.ts
let wss: WebSocketServer;

export function initializeWebSocket(server: any) {
    wss = new WebSocketServer({ server });
    
    interface ConnectedUser{
        jobId?:string;
        userId?:string;
        websocket?:WebSocket;
        name?:string;
    }
    let connectedUsers:ConnectedUser[]=[]
    
    wss.on('connection', function connection(ws) {
        ws.on('error', console.error);
      
        ws.on('message', function message(data, isBinary) {
            const stringData=data.toString();
            const parsedData=JSON.parse(stringData);
            if(parsedData.event==='join'){
                connectedUsers.push({
                    jobId:parsedData.jobId,
                    userId:parsedData.userId,
                    websocket:ws,
                    name:parsedData.name
                });

                wss.clients.forEach(function each(ws) {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({
                            event:'joined',
                            userId:parsedData.userId,
                            jobId:parsedData.jobId,
                            name:parsedData.name,
                        }))
                    }
                  });
               
                return true;
            }
            if(parsedData.event==='leave'){
                connectedUsers=connectedUsers.filter(user=>user.websocket!==ws);
                ws.send(JSON.stringify({
                    event:'left',
                    userId:parsedData.userId,
                    jobId:parsedData.jobId,
                }))
                return true;
            }   
            if(parsedData.event==='getconnectedusers'){
                ws.send(JSON.stringify({
                    event:'connectedusers',
                    connectedUsers:connectedUsers,
                }))
                return true;
            }
            if(parsedData.event==='notify'){
                wss.clients.forEach(function each(ws) {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({
                            event:'notify',
                            applicationId:parsedData.applicationId,
                        }))
                    }
                });
                return true;
            }
        });
        ws.on('close', function close(code, reason) {
            connectedUsers=connectedUsers.filter(user=>user.websocket!==ws);
            wss.clients.forEach(function each(ws) {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send(JSON.stringify({
                        event:'left',
                        websocket:ws,
                    }))
                }
            });
            return true;
        });

      });
}
