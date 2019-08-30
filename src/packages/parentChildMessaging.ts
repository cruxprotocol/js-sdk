class Message {

	source: string
	destination: string
	content: string

	public static makeMessage(source: string, target: string, content: string) {
		let msg:Message = new Message();
		msg.source = source
		msg.source = target
		msg.source = content
		return msg;
	}

	showMessage(): void {
		console.log('source: ' + this.source + ' destination:' +  this.destination + ' content:' + this.content)
	}
}

export class PostMessageMessage extends Message {

	public static makeMessage(source: string, target: string, type: string, data:JSON) {
		function _constructPostMessageContent(type: string, data: JSON) {
			let content = {
				type: type,
				data: data
			}
			return JSON.stringify(content)
		}
		let content = _constructPostMessageContent(type, data)
		return super.makeMessage(source, target, content);
	}
}

abstract class AbstractCommunicator {
	name:string = "AbstractCommunicator";
	source = null;
	target = null;

	protected constructor(source, target) {
		this.source = source
		this.target = target
	}

	public postMessage(msg: Message):void {

	}

	public start(handler):void {}

	// protected getMessageContent():JSON {
	//     return JSON.parse('{}');
	// }
	// public stop():void {}
	// public wait():void {}
}

export class PostMessageCommunicator extends AbstractCommunicator{
	name:string = 'AbstractCommunicator';
	source = null;
	target = null;

	public postMessage(msg: Message):void {
		this.source.postMessage(msg.content, this.target)
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

export class CommunicatorFactory {
	communicatorLookup: { [name: string]: AbstractCommunicator; } = {
		'iframe': PostMessageCommunicator,
		'newtab': PostMessageCommunicator
	};

	public getInstance(name:string): AbstractCommunicator {
		return this.communicatorLookup[name];
	}

	public register(communicator:AbstractCommunicator):void {
		if (communicator.name == this.name)  // don't allow MessageDispatcher to register itself
			return;
		this.communicatorLookup[communicator.name] = communicator;
	}
}

export class MessageProcessor{

	communicator: AbstractCommunicator;
	source = null;
	target = null;

	constructor(type, source, target, handler) {
		this.source = source
		this.target = target
		this.communicator = new (new CommunicatorFactory().getInstance(type))(source, target)
		this.communicator.start(handler);
	}

}

