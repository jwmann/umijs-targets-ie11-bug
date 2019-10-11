import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import classNames from 'classnames';
import isEqual from 'lodash/isEqual';
import Lethargy from "exports-loader?this.Lethargy!lethargy/lethargy";
import { useMediaLayout } from 'use-media';
import { FormattedMessage, setLocale } from 'umi-plugin-react/locale';
import { RemoveScrollBar } from 'react-remove-scroll-bar';
import { useSpring, useTransition, animated, SpringValue } from 'react-spring'
import { useGesture } from 'react-use-gesture'
import { animateScroll } from 'react-scroll';
import { getItems } from '@/services/api';
import { Item } from '@/models/'
import { getLang } from '@/utils/';
import Pagination from '@/components/Pagination';
import ScrollingBackground from '@/components/ScrollingBackground';
import styles from './index.less';

const lethargy = new Lethargy();
setLocale( getLang(), false );

const BasicLayout: React.FC = () => {
  const [currentItem, setCurrentItem] = useState<number>( 0 );
  const prevItemRef = useRef<number>( 0 );
  const prevItem = prevItemRef.current;
  const [direction, setDirection] = useState<'up' | 'down'>( 'down' );

  function scrollTo( area: 'top' | 'bottom' ) {
    const animateScrollOptions = {
      duration: 500,
      smooth: "easeInOutQuint",
    };

    switch ( area ) {
      case 'top':
        animateScroll.scrollToTop( animateScrollOptions );
        setAtBottom( false );
        break;
      case 'bottom':
        animateScroll.scrollToBottom( animateScrollOptions );
        setAtBottom( true );
        break;
      default:
    }
  }

  const isMobile = useMediaLayout( { maxWidth: 991 } );
  const [atBottom, setAtBottom] = useState<boolean>( false );
  function switchItem( switchTo?: 'prev' | 'next' | number, context?: 'click' | 'drag' | 'scroll' ) {
    if ( switchTo === undefined ) return;

    let goToIndex = currentItem;

    switch ( switchTo ) {
      case 'prev':
        if ( currentItem === items.length - 1 && window.scrollY !== 0 )
          scrollTo( 'top' );
        else if ( currentItem !== 0 ) goToIndex = currentItem - 1;
        break;
      case 'next':
        if ( currentItem < items.length - 1 ) goToIndex = currentItem + 1;
        else if ( !isMobile ) scrollTo( 'bottom' );
        break;
      default:
        goToIndex = !isNaN( switchTo ) ? switchTo : currentItem;
        if ( goToIndex < items.length - 1 && window.scrollY !== 0 )
          scrollTo( 'top' );
    }

    switch ( context ) {
      case 'click':
      case 'scroll':
        setDirection( prevItem > goToIndex ? 'up' : 'down' );
        break;
      case 'drag':
        setDirection( prevItem < goToIndex ? 'up' : 'down' );
        break;
      default:
    }

    if ( goToIndex !== currentItem ) setCurrentItem( goToIndex );
  }

  const [items, setItems] = useState<Item[]>( [] );
  const [loading, setLoading] = useState<boolean>( true );

  useEffect( () => { // Get Items
    getItems().then( ( items: Item[] ) => {
      if ( items && Array.isArray( items ) ) setItems( items );
      setLoading( false );
    } );
    if ( window.scrollY !== 0 ) scrollTo( 'top' );
  }, [] )

  const [dragging, setDragging] = useState<boolean>( false );
  const dragThreshold: number = 40;
  const [scrollFired, setScrollFired] = useState<boolean>( false );
  useEffect( () => {
    const resetScrollFired = setTimeout( () => setScrollFired( false ), 300 );
    return () => {
      clearTimeout( resetScrollFired );
    }
  }, [scrollFired] );

  const [{ y: springY }, setSpringY] = useSpring( () => ( { y: 0 } ) );
  const bindEvents = useGesture( {
    onDrag: ( { down, movement: [, y], last, memo = springY.getValue() } ) => {
      if ( dragging !== down ) setDragging( down );
      setSpringY( { y: down ? y + memo : 0 } );
      if ( !down && last ) {
        if ( y < -dragThreshold ) switchItem( 'next', 'drag' );
        else if ( y > dragThreshold ) switchItem( 'prev', 'drag' );
      }
      return memo;
    },
    onWheel: ( { event, first, delta: [, y] } ) => {
      const handleSwitch = () => {
        if ( y > 0 ) switchItem( 'next', 'scroll' );
        if ( y < 0 ) switchItem( 'prev', 'scroll' );
      }
      const scrolling = event && lethargy.check( event ) !== false;
      if ( !first && scrolling && !scrollFired ) {
        setScrollFired( true );
        handleSwitch();
      }
    }
  } );

  const menubarFullHeight = useMemo( () => {
    const menubar = window.document.querySelector( '.menubar' ) as HTMLElement;
    if ( menubar ) {
      const elementStyles = window.getComputedStyle( menubar );
      const heightWithPadding = menubar.offsetHeight;
      const marginTop = parseInt( elementStyles.marginTop || '0' );
      const marginBottom = parseInt( elementStyles.marginBottom || '0' );
      return heightWithPadding + marginTop + marginBottom;
    } else return 0;
  }, [currentItem, items] );

  const [containerHeight, setContainerHeight] = useState<string>( calculateContainerHeight );
  const [figureStyle, setFigureStyle] = useState<Omit<React.CSSProperties, 'minHeight'> & { minHeight?: number }>( calculateFigureStyle );
  useLayoutEffect( () => {
    const newContainerHeight = calculateContainerHeight();
    if ( !isEqual( containerHeight, newContainerHeight ) ) setContainerHeight( newContainerHeight );
  }, [currentItem, items] );

  const minHeightRef = useRef<number>( 0 );
  const enterItemCallback = useCallback( ( node: HTMLElement ) => {
    const minHeight = minHeightRef.current;
    if ( node && node.offsetHeight !== minHeight ) {
      minHeightRef.current = node.offsetHeight;
      setFigureStyle( calculateFigureStyle( node ) );
    }
  }, [currentItem, items] );

  const fromDirection = direction === 'up' ? '' : '-';
  const leaveDirection = direction === 'up' ? '-' : '';
  const transformWithDrag = ( fallback: SpringValue | string, speedMultiplier: number = 1 ) => dragging ? springY.to( ( y: number ) => `translateY(${ y * speedMultiplier }px)` ) : fallback;
  const transitions = useTransition( items[currentItem], item => item && !loading ? item.nid : 0, {
    from: {
      imageTransform: `translateY(${ fromDirection }125vh)`,
      figcaptionTransform: `translateY(${ fromDirection }100vh)`,
      figcaptionOpacity: 0,
    },
    enter: {
      imageTransform: transformWithDrag( 'translateY(0)' ),
      figcaptionTransform: transformWithDrag( 'translateY(0)', 0.33 ),
      figcaptionOpacity: 1,
    },
    leave: {
      imageTransform: `translateY(${ leaveDirection }125vh)`,
      figcaptionTransform: `translateY(${ leaveDirection }100vh)`,
      figcaptionOpacity: 0,
    }
  } );

  const LearnMoreButton = ( { nid, title }: { nid: string | number, title: string } ) => nid ? (
    <a className={classNames( styles.cta, 'btn-cta', { mobile: isMobile } )} href={`/node/${ nid }`} title={title}>
      <FormattedMessage id="item.cta" defaultMessage="Learn More" />
    </a>
  ) : null;

  function renderItem() {
    const getTitleFragment = ( title: string, fragment: number = 1 ) => typeof title === 'string' ? title.replace( /^(\w*)\s(.*)$/, `$${ fragment }` ) : "";

    return transitions.map( ( {
      item,
      key,
      props: {
        imageTransform,
        figcaptionTransform,
        figcaptionOpacity,
      },
      phase
    } ) => {
      if ( !item ) return null;
      const { nid, title, body, image } = item;

      return (
        <figure key={key} className={classNames( styles.item )} style={figureStyle} >
          <animated.figcaption
            ref={phase === 'enter' ? enterItemCallback : null}
            className={classNames( 'col-md-5', styles.text )}
            style={{
              opacity: figcaptionOpacity,
              transform: phase !== 'leave' ? transformWithDrag( figcaptionTransform, 0.33 ) : figcaptionTransform,
            }}
          >
            <h1 className="product-title">
              <span className="uppertitle">{getTitleFragment( title, 1 )}</span>
              <span className="title">{getTitleFragment( title, 2 )}</span>
            </h1>
            {!isMobile && <div className={styles.description} dangerouslySetInnerHTML={{ __html: body }} />}
          </animated.figcaption>
          <animated.div
            className={classNames( styles.image, 'col-md-7' )}
            style={{
              transform: phase !== 'leave' ? transformWithDrag( imageTransform ) : imageTransform,
            }}
          >
            <img src={image} />
          </animated.div>
          {!isMobile && <LearnMoreButton nid={nid} title={title} />}
        </figure>
      )
    } );
  }

  function renderScrollingBackground() {
    if ( loading || ( !items.length && !items[currentItem] ) ) return null;
    return (
      <ScrollingBackground
        direction={direction}
        container={scrollingBackgroundContainer}
        minHeight={figureStyle.minHeight}
        currentItem={currentItem}
        sprite={items[currentItem].image_background}
        dragging={dragging}
        spring={springY}
      />
    );
  }

  function calculateContainerHeight() {
    if ( menubarFullHeight ) return `calc(100vh - ${ menubarFullHeight }px)`;
    else return '75vh';
  }

  function calculateFigureStyle( node?: HTMLElement ) {
    const style: Omit<React.CSSProperties, 'minHeight'> & { minHeight?: number } = {};
    style.height = menubarFullHeight ? `calc(80vh - ${ menubarFullHeight }px)` : '60vh';

    if ( node ) style.minHeight = node.offsetHeight + 30;

    return style
  }

  function renderScrollUpButton() {
    if ( isMobile ) return null;
    const style: React.CSSProperties = atBottom ? {
      opacity: 1,
    } : {
        opacity: 0,
        transform: 'translateY(110%)'
      };

    return (
      <button
        className={classNames( 'btn-up', styles.scrollUpButton )}
        onClick={() => scrollTo( 'top' )}
        style={style}
      >
        <i className="fa fa-chevron-up" aria-hidden="true"></i>
      </button>
    );
  }

  useEffect( () => {
    prevItemRef.current = currentItem;
  }, [currentItem] );

  const handlePageClick = ( event: React.MouseEvent<HTMLLIElement>, pageIndex: number ) => switchItem( pageIndex, 'click' );

  const currentItemProps: Item | any = items.length ? items[currentItem] : {};
  const { nid, title, colour } = currentItemProps;
  const wrapperRef = useRef<HTMLDivElement>( null );
  const scrollingBackgroundContainer = wrapperRef && wrapperRef.current ? wrapperRef.current : undefined;

  return (
    <div
      className={classNames( styles.container, { [`background-color-${ colour }`]: colour } )}
      {...bindEvents()}
      style={{
        height: containerHeight,
      }}>
      <RemoveScrollBar />
      {renderScrollingBackground()}
      <div ref={wrapperRef} className={classNames( styles.wrapper, 'body-background-color' )} style={figureStyle}>
        {renderItem()}
      </div>
      <Pagination pages={items.length} active={currentItem} onClick={handlePageClick} />
      {renderScrollUpButton()}
      {isMobile && <LearnMoreButton nid={nid} title={title} />}
    </div>
  );
};

export default BasicLayout;
