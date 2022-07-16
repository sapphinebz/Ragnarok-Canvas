import { fromEvent, share, tap } from 'rxjs';

export function onDocumentKeydown(eventName: string) {
  return fromEvent<KeyboardEvent>(document, eventName).pipe(
    tap((event) => {
      event.preventDefault();
      event.stopPropagation();
    }),
    share()
  );
}