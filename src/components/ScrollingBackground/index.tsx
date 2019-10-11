import React, { useState, useEffect, useRef } from 'react';
import debounce from 'lodash/debounce';
import useEventListener from '@use-it/event-listener';
import { easeInOutQuint } from 'easing-utils';
import { SpringValue } from 'react-spring'
import { Stage, TilingSprite, useTick, _ReactPixi } from '@inlet/react-pixi';
import styles from './index.less';

import defaultSprite from '@/assets/defaultTile.png';

export interface ScrollingBackgroundProps extends BackgroundSpriteProps {
  style?: React.CSSProperties;
  container?: HTMLElement;
  minHeight?: number;
}

export type DimensionProps = {
  width?: number;
  height?: number;
}

export interface BackgroundSpriteProps extends DimensionProps {
  sprite?: string;
  currentItem?: number;
  dragging?: boolean;
  spring?: SpringValue;
  direction?: 'up' | 'down';
}

const BackgroundSprite: React.FC<BackgroundSpriteProps> = ( props: BackgroundSpriteProps ) => {
  const { direction, width = 0, height = 0, currentItem = 0, sprite, dragging = false, spring } = props;

  const prevItemRef = useRef<number>( 0 );
  useEffect( () => {
    prevItemRef.current = currentItem;
    setScrolling( true );
  }, [currentItem] );

  const [currentSprite, setCurrentSprite] = useState<string>( defaultSprite );
  // Load the item's sprite on first load, instead of the default sprite
  useEffect( () => {
    if ( !scrolling && sprite && sprite !== currentSprite ) setCurrentSprite( sprite );
  }, [] );

  const scrollingTimerRef = useRef<number>( 0 );
  const prevDistanceRef = useRef<number>( 0 );
  const [scrolling, setScrolling] = useState<boolean>( false );
  const [spriteYPosition, setSpriteYPosition] = useState<number>( 0 );
  useTick( ( delta: number = 0 ) => {
    let newYPosition = spriteYPosition;
    let scrollingTimer = scrollingTimerRef.current;
    if ( dragging && spring ) newYPosition += spring.getValue() * 0.025;

    if ( scrolling ) {
      // Scroll background with easing movement
      if ( scrollingTimer < 1 ) {
        scrollingTimer += delta * 0.025;
        const maxDistance = height;
        const currentDistance = maxDistance * easeInOutQuint( scrollingTimer );
        const movingDistance = currentDistance - prevDistanceRef.current;
        if ( direction === 'up' ) newYPosition -= movingDistance
        else newYPosition += movingDistance;

        // Switch sprite while we're in the middle of the transition
        const hasNewSprite = sprite !== currentSprite;
        const middleOfAnimation = scrollingTimer >= 0.475 && scrollingTimer <= 0.525;
        if ( sprite && hasNewSprite && middleOfAnimation ) setCurrentSprite( sprite );

        // Set previous values for comparison on the next tick
        scrollingTimerRef.current = scrollingTimer;
        prevDistanceRef.current = currentDistance;
      } else {
        scrollingTimerRef.current = 0;
        prevDistanceRef.current = 0;
        setScrolling( false );
      }
    } else newYPosition += delta * 0.1;

    setSpriteYPosition( newYPosition );
  } );

  return (
    <TilingSprite
      image={currentSprite}
      width={width}
      height={height}
      tilePosition={[100, spriteYPosition]}
    />
  )
}

const ScrollingBackground: React.FC<ScrollingBackgroundProps> = ( props: ScrollingBackgroundProps ) => {
  const { container, minHeight = 0, currentItem, sprite, dragging, direction, spring, style } = props;
  const options: _ReactPixi.ApplicationOptions = {
    transparent: true
  };

  const getContainerDimensions = () => container ? {
    width: container.offsetWidth,
    height: minHeight > container.offsetHeight ? minHeight : container.offsetHeight,
  } : {}

  const [dimensionProps, setDimensionProps] = useState<DimensionProps>( {} );
  const setContainerDimensions = debounce( () => setDimensionProps( getContainerDimensions() ), 200, { leading: false, trailing: true } );
  useEffect( () => {
    setDimensionProps( getContainerDimensions() );
  }, [container, currentItem, minHeight] );

  useEventListener( 'resize', () => {
    setContainerDimensions();
  } );

  return (
    <Stage {...dimensionProps} className={styles.scrollingBackground} options={options} style={style}>
      <BackgroundSprite
        {...dimensionProps}
        currentItem={currentItem}
        sprite={sprite || defaultSprite}
        dragging={dragging}
        spring={spring}
        direction={direction}
      />
    </Stage>
  );
};

ScrollingBackground.defaultProps = {
  style: {},
  container: undefined,
  minHeight: 0,
  currentItem: 0,
  sprite: defaultSprite,
  dragging: false,
  spring: undefined,
  direction: undefined
}

export default ScrollingBackground;
