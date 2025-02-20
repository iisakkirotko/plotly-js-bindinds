from pathlib import Path

from anywidget import AnyWidget
import traitlets

import numpy as np
import pandas as pd
import solara


class PlotlyWidget(AnyWidget):
    _esm = Path(__file__).parent.parent / "dist" / "plotlywidget.js"
    _css = Path(__file__).parent.parent / "dist" / "plotlywidget.css"
    
    _widget_data = traitlets.List([]).tag(sync=True)
    _widget_layout = traitlets.Dict({}).tag(sync=True)

# Create sample data
np.random.seed(42)
n_points = 15000
df = pd.DataFrame({
    'x': np.random.normal(0, 1, n_points),
    'y': np.random.normal(0, 1, n_points),
    'cell_idx': np.arange(n_points)
})
data = [{"x": df.x.to_list(), "y": df.y.to_list(), "type": "scattergl", "mode": "markers"}]

@solara.component
def Page():
    selected_indices = solara.use_reactive([])

    plot = PlotlyWidget.element(
        _widget_data=data,
        _widget_layout={
            "title": {
                "text": 'Sales Growth'
            },
            "dragmode": 'lasso',
            "xaxis": {
                "title": {
                "text": 'Year'
                },
                "showgrid": False,
                "zeroline": False
            },
            "yaxis": {
                "title": {
                "text": 'Percent'
                },
                "showline": False
            }
        }
    )

    solara.Markdown(f"Selected indices: ```{selected_indices.value}```")

    def handle_messages():
        plot_widget = solara.get_widget(plot)

        def handle_selection(msg_data):
            selected: list[list[int]] = [[] for _ in range(len(data))]
            for i, dataset_index in enumerate(msg_data["trace_indexes"]):
                selected[dataset_index].append(msg_data["point_indexes"][i])
            selected_indices.set(selected)

        def handle_message(widget, msg, buffers):
            if msg["event_type"] == "plotly_selected":
                handle_selection(msg["points"])
            else:
                print("Unknown message", msg)
        
        plot_widget.on_msg(handle_message)

        def cleanup():
            plot_widget.on_msg(handle_message, remove=True)

        return cleanup

    solara.use_effect(handle_messages, [])
