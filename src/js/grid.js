import { calcWinsize, adjustedBoundingRect } from './utils';
import LocomotiveScroll from 'locomotive-scroll';
import { gsap } from 'gsap';
import { ContentItem } from './contentItem';
import { GridItem } from './gridItem';

// Body element
const bodyEl = document.body;

// Calculate the viewport size
let winsize = calcWinsize();
window.addEventListener('resize', () => (winsize = calcWinsize()));

/**
 * Grid Class represents a grid of items
 */
export class Grid {
  // DOM elements
  DOM = {
    // main element (.columns)
    el: null,
    // The .column elements (odd columns) that will animate to the opposite scroll direction
    oddColumns: null,
    // .column__item
    gridItems: null,
    // .content
    content: document.querySelector('.content'),
    // content__item
    contentItems: document.querySelectorAll('.content__item'),
    // .heading
    heading: {
      top: document.querySelector('.heading--up'),
      bottom: document.querySelector('.heading--down'),
    },
    // button-back
    backCtrl: document.querySelector('.button-back'),
    // .content__nav
    contentNav: document.querySelector('.content__nav-item'),
  };
  // GridItem instances array
  gridItemArr = [];
  // index of current grid item
  currentGridItem = -1;
  // Checks if in grid mode or if in content mode
  isGridView = true;
  // Checks for active animation
  isAnimating = false;
  // Scroll chaced value
  lastscroll = 0;

  /**
   * Constructor
   * @param {Element} DOM_el - teh .columns element
   */
  constructor(DOM_el) {
    this.DOM.el = DOM_el;
    // first and third/odd columns
    this.DOM.oddColumns = [...this.DOM.el.querySelectorAll('.column')].filter(
      (_, index) => index != 1
    );
    // grid items(figure.column__item)
    this.DOM.gridItems = [...this.DOM.el.querySelectorAll('.colomn__item')];

    // Assign a ContentItem to each GridItem
    this.DOM.gridItems.forEach(gridItem => {
      const newItem = new GridItem(gridItem);
      this.gridItemArr.push(newItem);
      // The ContentItem instance
      newItem.contentItem = new ContentItem(
        this.DOM.contentItems[newItem.postion]
      );
    });
    // Initialize the Locomotive scroll
    // Initialize the events on the page
    // Track which items are visible
  }
  /**
   * Initialize the locomotive scroll
   * el: Scroll container element
   * smooth: Smooth scrolling, boolean type
   * lerp: Linear interpolation (lerp) intensity. Float between 0 and 1. This defines the "smoothness" intensity. The closer to 0, the smoother.
   * smartphone & tablet: Object allowing to override some options for a particular context. You can specify:
   - smooth
   - direction
   - horizontalGesture
   For tablet context you can also define breakpoint (integer, defaults to 1024) to    set the max-width breakpoint for tablets.
   */
  initSmoothScroll() {
    this.lscroll = new LocomotiveScroll({
      el: this.DOM.el,
      smooth: true,
      lerp: 0.13,
      smartphone: { smooth: true },
      tablet: { smooth: true },
    });
    // Locomotive scroll event: translate the first and third grid column -1*scrollValue px.
    this.lscroll.on('scroll', obj => {
      this.lastscroll = obj.scroll.y;
      this.DOM.oddColumns.forEach(
        column => (column.style.transform = `translateY(${this.lastscroll}px)`)
      );
    });
  }
  /**
   * Initialize events
   */
  initEvents() {
    // For every grid item
    for (const [position, gridItem] of this.gridItemArr.entries()) {
      // Open the gridItem and reveal its content
      gridItem.DOM.img.outer.addEventListener('click', () => {
        if (
          !this.isGridView ||
          this.isAnimating ||
          document.documentElement.classList.contains('has-scroll-scrolling')
        ) {
          return false;
        }
        this.isAnimating = true;
        this.isGridView = false;

        // Update currentGridItem
        this.currentGridItem = position;

        // Stop/Destroy Locomotive scroll
        this.lscroll.destroy();
        this.showContent(gridItem);
      });
    }
  }
  showContent(gridItem) {
    // All the other (that are inside the viewport)
    this.viewportGridItems = this.gridItemArr.filter(
      el => el != gridItem && el.DOM.el.classList.contains('.in-view')
    );
    // Remaining (not in the viewport)
  }
}
