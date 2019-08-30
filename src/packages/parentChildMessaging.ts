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
	source = null
	target = null

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
	source = null
	target = null

	public postMessage(string, type: string, data:JSON):void {
		let content = PostMessageMessage._constructPostMessageContent(type, data)
		this.source.postMessage(content, this.target)
	}

	public start(handler):void {
		window.addEventListener('message', (event) => {
			if (typeof(event.data) == "string") {
				return handler(JSON.parse(event.data))
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

