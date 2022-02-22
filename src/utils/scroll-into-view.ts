export default function scrollIntoViewIfNeeded(target: HTMLElement, container: HTMLElement) {
   const targetBounds = target.getBoundingClientRect();
   const { top, bottom } = container.getBoundingClientRect();

   if (targetBounds.top < top || targetBounds.bottom > bottom) {
      target.scrollIntoView();
   }
}