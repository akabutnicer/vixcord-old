import * as bodyParser from "body-parser";
import { createUser, searchUsers } from "./controllers/user.controller";
import {
  createConversation,
  getAllConversations,
  addMessageToConversation,
  getConversationMessages,
} from "./controllers/conversions.controller";

import express, {Request, Response} from 'express'


import { Server } from "socket.io";
import http from "http";
import Socket from "./utils/socket";
import * as types from "./types";
import ViteExpress from "vite-express";

import * as fs from 'fs';
import { createServer } from 'vite';
const app = express();


app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get("server/users/create", createUser);
app.get("server/users/search", searchUsers);
app.post("/conversations/create", createConversation);
app.get("*/conversations", getAllConversations);
app.post("/messages/create", addMessageToConversation);
app.get("/messages/get", getConversationMessages);
app.listen(4000);


