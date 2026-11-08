declare module 'page-flip' {
  export class PageFlip {
    constructor(element: HTMLElement, options?: any);
    loadFromHTML(items: NodeListOf<Element> | HTMLElement[]): void;
    loadFromImages(images: string[]): void;
    flipNext(corner?: 'top' | 'bottom'): void;
    flipPrev(corner?: 'top' | 'bottom'): void;
    flip(page: number, corner?: 'top' | 'bottom'): void;
    on(event: string, callback: (e: any) => void): void;
    off(event: string, callback: (e: any) => void): void;
    destroy(): void;
    getPageCount(): number;
    getCurrentPageIndex(): number;
    getOrientation(): 'portrait' | 'landscape';
    updateFromHtml(items: NodeListOf<Element> | HTMLElement[]): void;
  }
}
