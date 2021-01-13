import createSubject, { Subject as SJ } from 'rx-subject'

export class Subject<T = any> {
  private subject: SJ<T>
  constructor() {
    this.subject = createSubject<T>()
  }

  next(value: T) {
    this.subject.sink.next(value)
  }

  subscribe(subscriber: (value: T) => void) {
    return this.subject.source$.subscribe(subscriber)
  }
}
