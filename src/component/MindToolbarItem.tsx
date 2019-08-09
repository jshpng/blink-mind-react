import * as React from "react";
import * as cx from "classnames";
import { MindNodeLayerWidget } from "./MindNodeLayerWidget";
import { OpType } from "../model/MindMapModelModifier";

export type ToolbarItemConfig = {
  icon: string;
  label: string;
  opType?: OpType;
  clickHandler?: (diagramState, nodeKey) => void;
};

interface MindToolbarItemProps {
  config: ToolbarItemConfig;
  getRef?: Function;
}

interface MindToolbarItemState {}

export class MindToolbarItem extends React.Component<
  MindToolbarItemProps,
  MindToolbarItemState
> {
  constructor(props) {
    super(props);
  }
  onClick = ()=> {
    // @ts-ignore
    let mindNodeLayerWidget : MindNodeLayerWidget  =  this.props.getRef("MindNodeLayerWidget");
    mindNodeLayerWidget.op(this.props.config.opType);
  };
  render() {
    const { config } = this.props;
    return (
      <span className={cx("bm-toolbar-item","iconfont", `bm-${config.icon}`)} onClick={this.onClick}>
      </span>
    );
  }
}
