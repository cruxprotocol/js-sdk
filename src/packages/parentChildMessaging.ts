import { any } from "async";

class Message {

	source: string
	destination: string
	content: string

	public static makeMessage(source: string, target: string, content: string) {
		let msg: Message = new Message()
		msg.source = source
		msg.source = target
		msg.source = content
		return msg
	}

	showMessage(): void {
		console.log('source: ' + this.source + ' destination:' +  this.destination + ' content:' + this.content)
	}
}

class PostMessageMessage extends Message {

	public static _constructPostMessageContent(type: string, data: JSON) {
		let content = {
			type: type,
			data: data
		}
		return JSON.stringify(content)
	}
}

abstract class AbstractCommunicator {
	name: string = "AbstractCommunicator"
	source: any
	target: any

	protected constructor(source, target) {
		this.source = source
		this.target = target
	}

	public postMessage(...args):void {

	}

	public start(handler):void {}

	// protected getMessageContent():JSON {
	//     return JSON.parse('{}');
	// }
	// public stop():void {}
	// public wait():void {}
}

class PostMessageCommunicator extends AbstractCommunicator{
	name: string = 'PostMessageCommunicator'

	public postMessage(type: string, data: JSON): void {
		console.log(type, data)
		let content = PostMessageMessage._constructPostMessageContent(type, data)
		this.source.postMessage(content, this.target)
	}

	public start(handler): void {
		window.addEventListener('message', (event) => {
			if (typeof(event.data) == "string") {
			    // We should only process those event whose source is communicator's target or when target is '*'
				// https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage#Security_concerns
			    if (this.target == '*' || this.target == event.origin) {
					return handler(JSON.parse(event.data))
				}
			}
		})
	}

	// protected getMessageContent():JSON {
	//
	// }
	// public stop():void {}
	// public wait():void {}
}

class CommunicatorFactory {
	communicatorLookup: { [name: string]: AbstractCommunicator } = {
		'iframe': PostMessageCommunicator,
		'newtab': PostMessageCommunicator
	}

	public getInstance(type: string): AbstractCommunicator {
		return this.communicatorLookup[type]
	}

	public register(type: string, communicator: AbstractCommunicator):void {
		if (type in this.communicatorLookup)  // don't allow MessageDispatcher to register itself
			return;
		this.communicatorLookup[type] = communicator
	}
}

export class MessageProcessor{

	communicator: AbstractCommunicator
	source = null
	target = null

	constructor(type, source, target, handler) {
		this.source = source
		this.target = target
		this.communicator = new (new CommunicatorFactory().getInstance(type))(source, target)
		this.communicator.start(handler)
	}

}

