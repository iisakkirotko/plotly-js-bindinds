import Plotly from 'plotly.js';
import { type AnyModel, type AnyWidget, type RenderProps } from '@anywidget/types';

type Serializer<In=any, Out=any> = {
  deserialize(value: Out): In;
  serialize(value: In): Out;
}

type Points = {
  trace_indexes: (string | number | Date | null)[];
  point_indexes: (string | number | Date | null)[];
  xs: (string | number | Date | null)[];
  ys: (string | number | Date | null)[];
  zs?: (string | number | Date | null)[];
};

// class PlotlyModel implements AnyModel {
//   model: AnyModel;
//   serializers: Record<string, Serializer>;
//   widget_manager;
  
//   constructor(model: AnyModel, serializers: Record<string, Serializer>) {
//     this.model = model;
//     this.serializers = serializers;
//     this.widget_manager = model.widget_manager;
//   }

//   defaults() {
//     return {
//       _widget_data: [],
//       _widget_layout: {},
//     }
//   }

//   get(key: string) {
//     const serializer = this.serializers[key];
//     const update = this.model.get(key)
//     if (serializer?.deserialize) {
//       return serializer.deserialize(update)
//     }
//     return update;
//   }

//   set(key: string, value: unknown) {
//     let serializer = this.serializers[key];
//     if (serializer?.serialize) {
//       value = serializer.serialize(value)
//     }
//     this.model.set(key, value);
//   }

//   off(eventName: string, callback?: () => void) {
//     this.model.off(eventName, callback);
//   }

//   on(eventName: string, callback: (...args: any[]) => void) {
//     this.model.on(eventName, callback);
//   }

//   save_changes() {
//     this.model.save_changes();
//   }

//   send(content: any, callbacks?: any, buffers?: ArrayBuffer[] | ArrayBufferView[]) {
//     this.model.send(content, callbacks, buffers);
//   }
// }

class PlotlyView {
  model: AnyModel;
  el: HTMLElement;
  plot: Plotly.PlotlyHTMLElement | undefined;

  constructor(props: {model: AnyModel, el: HTMLElement}) {
    console.log("PlotlyView constructor", props);
    this.model = props.model;
    this.el = props.el;

    // Attach listeners for model changes
    this.model.on('change:_widget_data', () => this.render());
    this.model.on('change:_widget_layout', () => this.render());
  }

  render = async () => {
    const data = this.model.get('_widget_data');
    const layout = this.model.get('_widget_layout');
    this.plot = await Plotly.react(this.el, data, layout);

    this.plot.on("plotly_selected", this.handleSelection);
  }

  handleSelection = (eventData: Plotly.PlotSelectionEvent) => {
    if (!eventData || !eventData.points) {
      // Happens, for example, when clicking on the plot with a selection tool enabled
      return;
    }
    // The received data can contain circular references, so we need to flatten it
    const points = eventData.points;

    let data: Points = {
      trace_indexes: new Array(points.length),
      point_indexes: new Array(points.length),
      xs: new Array(points.length),
      ys: new Array(points.length),
    };

    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      data.trace_indexes[i] = point.curveNumber;
      data.point_indexes[i] = point.pointNumber;
      data.xs[i] = point.x;
      data.ys[i] = point.y;
    }

    console.log('plotly_selected', eventData);
    this.model.send({event_type: 'plotly_selected', points: data});
  }

  close() {
    Plotly.purge(this.el);
  }
}

export default (): AnyWidget => {
  let model: AnyModel;
  return {
    initialize(context) {
      // model = new PlotlyModel(context.model, {});
      model = context.model;
    },
    async render(props: RenderProps) {
      const plot = new PlotlyView({model, el: props.el});
      await plot.render();
      return () => plot.close();
    }
  }
}