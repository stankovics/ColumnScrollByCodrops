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
    this.remainingGridItem = this.gridItemArr
      .filter(el => !this.viewportGridItems.includes(el) && el != gridItem)
      .map(gridItem => gridItem.DOM.el);

    // image outer elements
    this.viewportGridItemsImgOuter = this.viewportGridItems.map(
      gridItem => gridItem.DOM.img.outer
    );
    // Calculate the transform to apply to the gridItem's image .
    const imageTransform = this.calcTransformImage();

    gsap.killTweensOf([gridItem.DOM.img.outer, gridItem.DOM.img.inner]);
    this.timeline = gsap.timeline({
      defaults: {
        duration: 1.4,
        ease: 'expo.inOut',
      },
      // overflow hidden
    });
  }
  /**
   * Calculates the scale value to apply to the images that animate to the .content__nav area (scale down to the size of a nav area item).
   * @param {Element} gridItemImageOuter - the gridItem image outer element.
   * @return {Number} the scale value.
   */
  getFinalScaleValue(gridItemImageOuter) {
    return (
      this.DOM.contentNavItems[0].offsetHeight / gridItemImageOuter.offsetHeight
    );
  }

  /**
   * Calculates the translate value to apply to the images that animate to the .content__nav area (position it on the nav area).
   * @param {Element} gridItemImageOuter - the gridItem image outer element.
   * @param {Number} position - the gridItem's position.
   * @return {JSON} the translation values.
   */
  getFinalTranslationValue(gridItemImageOuter, position) {
    const imgrect = adjustedBoundingRect(gridItemImageOuter);
    const navrect = adjustedBoundingRect(this.DOM.contentNavItems[position]);
    return {
      x: navrect.left + navrect.width / 2 - (imgrect.left + imgrect.width / 2),
      y: navrect.top + navrect.height / 2 - (imgrect.top + imgrect.height / 2),
    };
  }

  /**
   * Track which items are visible (inside the viewport)
   * by adding/removing the 'in-view' class when scrolling.
   * This will be used to animate only the ones that are visible.
   */
  trackVisibleItems() {
    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.intersectionRatio > 0) {
          entry.target.classList.add('in-view');
        } else {
          entry.target.classList.remove('in-view');
        }
      });
    });
    this.DOM.gridItems.forEach(item => observer.observe(item));
  }
  /**
   * Calculates the scale and translation values to apply to the images when we click on it (scale up and center it).
   * Also used to recalculate those values on resize.
   * @return {JSON} the translation and scale values
   */
  calcTransformImage() {
    const imgrect = adjustedBoundingRect(
      this.gridItemArr[this.currentGridItem].DOM.img.outer
    );
    return {
      scale: (winsize.height * 0.7) / imgrect.height,
      x: winsize.width * 0.5 - (imgrect.left + imgrect.width / 2),
      y: winsize.height * 0.5 - (imgrect.top + imgrect.height / 2),
    };
  }
}
