export class PriorityQueue {
    constructor() {
        this.items = [];
    }

    enqueue(element) {
        if (this.isEmpty()) {
            this.items.push(element);
        } else {
            let added = false;
            for (let i = 0; i < this.items.length; i++) {
                if (element.priority < this.items[i].priority) {
                    this.items.splice(i, 0, element);
                    added = true;
                    break;
                }
            }
            if (!added) {
                this.items.push(element);
            }
        }
    }

    dequeue() {
        return this.items.shift();
    }

    front() {
        return this.isEmpty() ? null : this.items[0];
    }

    isEmpty() {
        return this.items.length === 0;
    }

    size() {
        return this.items.length;
    }

    clear() {
        this.items = [];
    }
}
