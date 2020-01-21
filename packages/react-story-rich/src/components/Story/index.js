import React, { forwardRef, isValidElement, useCallback, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';

import isEmpty from 'lodash/isEmpty';
import isString from 'lodash/isString';
import last from 'lodash/last';

import Tree from '../../classes/Tree';
import Element from '../Element';
import Navigation from '../../classes/Navigation';

const scrollToBottom = (ref) => {
  if (ref) {
    window.scrollTo({
      top: ref.current.offsetTop + ref.current.offsetHeight,
      behavior: 'smooth',
    });
  }
};

export const nodeRenderer = (node, nav, defaultComponent = Element) => {
  // A Pipe
  if (isString(node)) {
    return [defaultComponent, {
      text: true,
      children: node,
      onTap: ({ goForward }) => goForward(),
    }];
  }

  const { component, ...nodeProps } = node;

  if (isEmpty(component)) { return [defaultComponent, nodeProps]; }

  const isValid = isValidElement(component);

  if (!isValid) {
    // eslint-disable-next-line no-console
    console.warn(`node.component is not a valid React Element --> fallback to defaultComponent`);
  }

  return [isValid ? component : defaultComponent, nodeProps];
};


const Story = forwardRef((props, ref) => {
  const {
    autoFocus,
    autoScroll,
    component: Component,
    dispatch,
    history,
    nodeComponent,
    nodeRenderer: renderer,
    tree: root,
    ...passThroughProps
  } = props;

  const currentLocation = useMemo(() => last(history).to, [history]);

  const trunk = useMemo(() => root.toTrunk(), [root]);

  const getNode = useCallback((key) => trunk.get(key), [trunk]);

  const isEnabled = useCallback((key) => key === currentLocation, [currentLocation]);

  const getNavigation = useCallback(({ key }) => (
    new Navigation(key, dispatch)
  ), [dispatch]);

  useEffect(() => {
    if (autoScroll) { scrollToBottom(ref); }
  }, [history, autoScroll, ref]);

  return (
    <Component ref={ref} {...passThroughProps}>
      {history.map(({ to: key }) => {
        const { node, location } = getNode(key);
        const nav = getNavigation(location);

        const [NodeComponent, nodeProps] = renderer(node, nav, nodeComponent);

        const injected = {
          autoFocus,
          enabled: isEnabled(key),
          key,
          location,
          tabIndex: key + 1,
          nav,
        };

        return <NodeComponent key={location.label} injected={injected} {...nodeProps} />;
      })}
    </Component>
  );
});

Story.propTypes = {
  /**
   * If set to false, elements will not be focused when being enabled.
   */
  autoFocus: PropTypes.bool,
  /**
   * If set to true, the body will scroll To Bottom
   * each time a new Element component is enabled.
   */
  autoScroll: PropTypes.bool,
  /**
   * The component used for the root node.
   * Either a string to use a DOM element or a component.
   */
  component: PropTypes.elementType,
  /**
   * The dispatcher of your store
   */
  dispatch: PropTypes.func.isRequired,
  /**
   * A collection of actions from the oldest to the most recent.
   * Is a save on its own and can easy be persisted.
   */
  history: PropTypes.arrayOf(PropTypes.shape({
    /**
     * The current location.
     */
    from: PropTypes.number,
    /**
     * The location to be next.
     */
    to: PropTypes.number,
    /**
     * The type of the action that were dispatched.
     * GO_TO or REWIND_TO.
     */
    type: PropTypes.string,
  })).isRequired,
  /**
   * A valid element type for default node rendering
   */
  nodeComponent: PropTypes.elementType,
  /**
   * A function returning [component, props]
   * for Story rendering.
   */
  nodeRenderer: PropTypes.func,
  /**
   * An instance of a Tree
   * See Tree API
   */
  tree: PropTypes.instanceOf(Tree).isRequired,
};

Story.defaultProps = {
  autoFocus: true,
  autoScroll: true,
  component: 'main',
  nodeComponent: Element,
  nodeRenderer,
};

export default Story;
