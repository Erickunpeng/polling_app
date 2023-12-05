import express, { Express } from "express";
import {list, getPoll, addPoll, vote} from './routes';
import bodyParser from 'body-parser';


// Configure and start the HTTP server.
const port: number = 8088;
const app: Express = express();
app.use(bodyParser.json());
app.get("/api/getPoll", getPoll)
app.post("/api/addPoll", addPoll)
app.post("/api/vote", vote)
app.get("/api/list", list)
app.listen(port, () => console.log(`Server listening on ${port}`));
