import React, { Component } from 'react';
import { Animated, Dimensions, LayoutAnimation, PanResponder, UIManager, View } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
// 1/4 of the width of the screen
const SWIPE_THRESHOLD = 0.25 * SCREEN_WIDTH;
const SWIPE_OUT_DURATION_MILLIS = 250;

class Deck extends Component {
  static defaultProps = {
    onSwipeRight: () => {},
    onSwipeLeft: () => {},
    renderNoMoreCards: () => {}
  };

  constructor (props) {
    super(props);

    const position = new Animated.ValueXY();
    const panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (event, gesture) => {
        const {dx, dy} = gesture;
        console.log(dx);
        position.setValue({x: dx, y: dy});
      },
      onPanResponderRelease: (event, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          // swipe right
          this.forceSwipe('right');
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          // swipe left
          this.forceSwipe('left');
        } else {
          this.resetPosition();
        }
      }
    });

    this.position = position;
    this.state = {panResponder, topCardIndex: 0};
  }

  componentWillReceiveProps (nextProps) {
    if (nextProps.data !== this.props.data) {
      this.setState({topCardIndex: 0});
    }
  }

  componentWillUpdate () {
    // for android
    UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);

    LayoutAnimation.spring();
  }

  forceSwipe (direction) {
    const x = direction === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH;
    Animated.timing(this.position, {
      toValue: {x, y: 0},
      duration: SWIPE_OUT_DURATION_MILLIS
    }).start(() => {
      // after the animation has finished NOW we want to setup next card
      this.onSwipeComplete(direction);
    });
  }

  onSwipeComplete (direction) {
    const {onSwipeLeft, onSwipeRight, data} = this.props;
    const item = data[this.state.index];
    direction === 'right' ? onSwipeRight(item) : onSwipeLeft(item);
    this.position.setValue({x: 0, y: 0});
    this.setState({topCardIndex: this.state.topCardIndex + 1});
  }

  resetPosition () {
    Animated.spring(this.position, {
      toValue: {x: 0, y: 0}
    }).start();
  }

  // e.g. if x was at -300 => -90deg, so it maps -500 -> 500 to -120deg -> 120deg by stating
  // it is approx 20% through the inputRange so it should be 20% to the outPutRange
  getCardStyle () {
    // postion.x is how much the position has changed in the x-axis
    const rotate = this.position.x.interpolate({
      // [min, mid, max]
      // the 1.5 makes it rotate a bit less since it takes more DISTANCE to get from low to mid to high for ROTATION
      inputRange: [-SCREEN_WIDTH * 1.5, 0, SCREEN_WIDTH * 1.5], // the distance the card has been dragged on the screen
      outputRange: ['-120deg', '0deg', '120deg'] // the degrees it maps to
    });

    return {
      ...this.position.getLayout(),
      transform: [{rotate}]
    };
  }

  renderCards () {
    const {data, renderNoMoreCards, renderCard} = this.props;
    const {topCardIndex} = this.state;
    if (this.state.topCardIndex >= data.length) {
      return renderNoMoreCards();
    }

    return data.map((item, index) => {
      if (index === topCardIndex) {
        return (
          <Animated.View
            key={item.id}
            style={[this.getCardStyle(), styles.cardStyle]}
            {...this.state.panResponder.panHandlers}>
            {renderCard(item)}
          </Animated.View>
        );
      } else if (index < topCardIndex) {
        // no longer on the deck
        return null;
      }

      // wrap in Animated.View otherwise when this card is re-rendered when the index
      // is equal to the topCardIndex as an Animated.View we will see flashing images since
      // this causes react to re-fetch the image.
      return (
        <Animated.View key={item.id} style={[styles.cardStyle, {top: (10 * (index - topCardIndex))}]}>
          {renderCard(item)}
        </Animated.View>
      );
    }).reverse();
  }

  render () {
    return (
      <View>
        {this.renderCards()}
      </View>
    );
  }

}

const styles = {
  cardStyle: {
    position: 'absolute', // note with JUST this it spans only the length of the largest element
    // causes the card to span full width of screen
    width: SCREEN_WIDTH
  }
};

export default Deck;