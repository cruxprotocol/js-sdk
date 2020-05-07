import {StrongPubSubClient} from "../../infrastructure/implementations";
import {InMemoryPubSubClient} from "./inmemory-infrastructure";

const pubsubImplementations = [StrongPubSubClient, InMemoryPubSubClient];

// TODO
