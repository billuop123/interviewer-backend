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
                const leavingUser = connectedUsers.find(user=>user.websocket===ws);
                connectedUsers=connectedUsers.filter(user=>user.websocket!==ws);
                console.log('User left:', leavingUser?.name, 'Remaining users:', connectedUsers.length);
                
                // Notify all clients about the user leaving
                wss.clients.forEach(function each(client) {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({
                            event:'left',
                            userId:leavingUser?.userId,
                            jobId:leavingUser?.jobId,
                            name:leavingUser?.name,
                        }))
                    }
                });
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
            const leavingUser = connectedUsers.find(user=>user.websocket===ws);
            connectedUsers=connectedUsers.filter(user=>user.websocket!==ws);
            console.log('Connection closed for user:', leavingUser?.name, 'Remaining users:', connectedUsers.length);
            
            // Notify all remaining clients about the user leaving
            wss.clients.forEach(function each(client) {
                if (client.readyState === WebSocket.OPEN && client !== ws) {
                    client.send(JSON.stringify({
                        event:'left',
                        userId:leavingUser?.userId,
                        jobId:leavingUser?.jobId,
                        name:leavingUser?.name,
                    }))
                }
            });
            return true;
        });

      });
}
