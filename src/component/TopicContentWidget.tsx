import * as React from "react";
import { BaseWidget } from "./common/BaseWidget";
import { NodeKeyType, NodeWidgetDirection } from "../types/Node";
import { DiagramState } from "../model/DiagramState";
import { OpType } from "../model/MindMapModelModifier";
import { NodePopupMenu } from "./NodePopupMenu";
import { OpFunction } from "../types/FunctionType";
import styled from "styled-components";
import debug from "debug";

const log = debug("node:topic");
const logr = debug("render:topic");

const TopicContent = styled.div`
  display: flex;
  align-items: center;
  word-wrap: break-word;
  white-space: pre-line;
  cursor: pointer;
  overflow: hidden;
  background: ${props =>
    //@ts-ignore
    props.dragEnter
      ? props.theme.color.primary
      //@ts-ignore
      : props.isRoot
      ? props.theme.color.primary
      : null};
  //@ts-ignore
  padding: ${props => (props.isRoot ? "6px 0 6px 20px" : "6px 20px 6px 0")};
  border: 2px solid ${props => props.theme.color.primary};
`;

const DescIcon = styled.div`
  &:hover {
    color: ${props => props.theme.color.primary};
  }
`;

interface TopicContentWidgetProps {
  diagramState: DiagramState;
  op: OpFunction;
  nodeKey: NodeKeyType;
  dir: NodeWidgetDirection;
  draggable: boolean;
  saveRef: Function;
  getRef: Function;
}

interface TopicContentWidgetState {
  dragEnter: boolean;
  showPopMenu: boolean;
}

let dragSrcItemKey: NodeKeyType = null;

export class TopicContentWidget extends BaseWidget<
  TopicContentWidgetProps,
  TopicContentWidgetState
> {
  constructor(props) {
    super(props);
    this.state = {
      dragEnter: false,
      showPopMenu: false
    };
  }

  onDragStart = e => {
    log("onDragStart");
    dragSrcItemKey = this.props.nodeKey;
    e.stopPropagation();
  };

  onDragOver = e => {
    e.preventDefault();
  };

  onDragEnter = () => {
    this.setState({
      dragEnter: true
    });
  };

  onDragLeave = e => {
    const { getRef, nodeKey } = this.props;
    let relatedTarget = e.nativeEvent.relatedTarget;
    let content = getRef(`content-${nodeKey}`);
    if (content == relatedTarget || content.contains(relatedTarget)) {
      return;
    }
    this.setState({
      dragEnter: false
    });
  };

  onDrop = () => {
    log("onDrop");
    let { nodeKey, op } = this.props;
    op(OpType.DRAG_AND_DROP, dragSrcItemKey, nodeKey);
    this.setState({
      dragEnter: false
    });
  };

  isDoubleClick: boolean;

  onClick = () => {
    this.isDoubleClick = false;
    setTimeout(() => {
      if (!this.isDoubleClick) {
        // log("TopicContentWidget onClick");
        let { diagramState, op, nodeKey } = this.props;
        if (diagramState.mindMapModel.getEditingContentItemKey() === nodeKey)
          return;
        op(OpType.SET_POPUP_MENU_ITEM_KEY, nodeKey);
        this.setState({ showPopMenu: true });
      }
    }, 200);
  };

  onDoubleClick = () => {
    this.isDoubleClick = true;
    // log('TopicContentWidget onDoubleClick');
    let { diagramState, op, nodeKey } = this.props;
    if (diagramState.mindMapModel.getEditingContentItemKey() === nodeKey)
      return;
    op(OpType.START_EDITING_CONTENT, nodeKey);
  };

  handlePopMenuVisibleChange = visible => {
    this.setState({
      showPopMenu: visible
    });
  };

  componentDidUpdate(
    prevProps: Readonly<TopicContentWidgetProps>,
    prevState: Readonly<TopicContentWidgetState>,
    snapshot?: any
  ): void {
    let { diagramState, nodeKey } = this.props;
    if (diagramState.mindMapModel.getEditingContentItemKey() === nodeKey) {
      document.addEventListener("click", this._handleClick);
    } else {
      document.removeEventListener("click", this._handleClick);
    }
  }

  _handleClick = e => {
    log(`_handleClick ${this.props.nodeKey}`);
    let { getRef, nodeKey } = this.props;
    let content: HTMLElement = getRef(`content-${nodeKey}`);
    let contentRect = content.getBoundingClientRect();
    let extend = 40;
    let isInExtendBox =
      e.clientX > contentRect.left - extend &&
      e.clientX < contentRect.right + extend &&
      e.clientY > contentRect.top &&
      e.clientY < contentRect.bottom;
    if (!isInExtendBox) {
      // TODO 需要对编辑器进行修改，现在暂时有bug
      // this.props.op(OpType.FOCUS_ITEM, null);
    }
  };

  shouldComponentUpdate(
    nextProps: Readonly<TopicContentWidgetProps>,
    nextState: Readonly<TopicContentWidgetState>,
    nextContext: any
  ): boolean {
    if (
      this.state.dragEnter !== nextState.dragEnter ||
      this.state.showPopMenu !== nextState.showPopMenu
    )
      return true;
    let { diagramState: ds, nodeKey, dir } = this.props;
    let {
      diagramState: nextDS,
      nodeKey: nextNodeKey,
      dir: nextDir
    } = nextProps;
    if (nodeKey !== nextNodeKey || dir !== nextDir) return true;
    let mm = ds.mindMapModel;
    let nextMm = nextDS.mindMapModel;
    let focusKey = mm.getFocusItemKey();
    let nextFocusKey = nextMm.getFocusItemKey();
    if (focusKey === nodeKey || nextFocusKey == nodeKey) {
      if (nextFocusKey !== focusKey) return true;

      let focusMode = mm.getFocusItemMode();
      let nextFocusMode = nextMm.getFocusItemMode();
      if (nextFocusMode !== focusMode) return true;
    }
    let content = mm.getItem(nodeKey).getContent();
    let nextContent = nextMm.getItem(nodeKey).getContent();
    if (content !== nextContent) return true;
    return false;
  }

  render() {
    let {
      diagramState,
      op,
      nodeKey,
      dir,
      draggable,
      saveRef,
      getRef
    } = this.props;
    logr(nodeKey);
    let { mindMapModel, config: diagramConfig } = diagramState;
    let visualLevel = mindMapModel.getItemVisualLevel(nodeKey);
    let itemStyle;
    switch (visualLevel) {
      case 0:
        itemStyle = diagramConfig.rootItemStyle;
        break;
      case 1:
        itemStyle = diagramConfig.primaryItemStyle;
        break;
      default:
        itemStyle = diagramConfig.normalItemStyle;
        break;
    }

    const item = mindMapModel.getItem(nodeKey);

    const showPopMenu =
      // mindMapModel.getPopupMenuItemKey() === nodeKey &&
      this.state.showPopMenu;
    const descString = item.descToString();
    const showDescIcon = descString !== null && descString !== "";

    return (
      <TopicContent
        //@ts-ignore
        isRoot={dir === NodeWidgetDirection.ROOT}
        dragEnter={this.state.dragEnter}
        draggable={draggable}
        // className={cx("content", {
        //   [`content-dir-${dir}`]: dir !== NodeWidgetDirection.ROOT,
        //   "root-topic": visualLevel === 0,
        //   "primary-topic": visualLevel === 1,
        //   "normal-topic": visualLevel > 1,
        //   "content-drag-enter": this.state.dragEnter
        // })}
        style={itemStyle}
        ref={saveRef(`content-${nodeKey}`)}
        onDragStart={this.onDragStart}
        onDragEnter={this.onDragEnter}
        onDragLeave={this.onDragLeave}
        onDragOver={this.onDragOver}
        onDrop={this.onDrop}
        onClick={this.onClick}
        onDoubleClick={this.onDoubleClick}
      >
        {diagramConfig.editorRendererFn(diagramState, op, nodeKey, saveRef)}
        {showDescIcon && (
          <DescIcon
            className="iconfont bm-notes"
            onClick={e => {
              e.stopPropagation();
              op(OpType.START_EDITING_DESC, nodeKey);
            }}
          />
        )}
        {showPopMenu && (
          <NodePopupMenu
            diagramState={diagramState}
            op={op}
            nodeKey={nodeKey}
            visible
            handleVisibleChange={this.handlePopMenuVisibleChange}
            getRef={getRef}
          />
        )}
      </TopicContent>
    );
  }
}
