import express from "express";
import * as bodyParser from "body-parser";
import { createUser, searchUsers } from "./controllers/user.controller";
import {
  createConversation,
  getAllConversations,
  addMessageToConversation,
  getConversationMessages,
} from "./controllers/conversions.controller";



import { Server } from "socket.io";
import http from "http";
import Socket from "./utils/socket";
import * as types from "./types";
import ViteExpress from "vite-express";

import fs from 'fs';
import { createServer } from 'vite';
const app: express.Application = express();


app.use(express.urlencoded({ extended: false }));
app.use(express.json());




// Add the import

// Add the user endpoints
app.get("server/users/create", createUser);
app.get("/backend/users/search", searchUsers);
app.post("/conversations/create", createConversation);
app.get("*/conversations", getAllConversations);
app.post("/messages/create", addMessageToConversation);
app.get("/messages/get", getConversationMessages);
const server = http.createServer(app);
const ioServer = new Server(server);
Socket.getInstance(ioServer);
server.listen(4000);

console.log(3);

