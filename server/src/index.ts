import express, { Express } from "express";
import {listPolls, getPoll, addPoll, votePoll, deletePoll} from './routes';
import bodyParser from 'body-parser';


// Configure and start the HTTP server.
const port: number = 8088;
const app: Express = express();
app.use(bodyParser.json());
app.get("/api/get", getPoll)
app.post("/api/add", addPoll)
app.post("/api/vote", votePoll)
app.post("/api/delete", deletePoll)
app.get("/api/list", listPolls)
app.listen(port, () => console.log(`Server listening on ${port}`));
