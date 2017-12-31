import React       from 'react';
import { connect } from 'react-redux';

import { Button, Input, Modal, Table } from 'antd';

import { apiModelsDataSource, modelsColumns } from '../../services/models';
import { modModelsActions }                   from '../../store/modules/models.redux';

class ModelsIndex extends React.Component {
  constructor(props) {
    super(props);

    console.log('models index dynamic props is', props);

    this.state = {
      models: {
        create: {
          visible: false,
          title  : null,
        },
      },
    };

    this.openCreate               = this.openCreate.bind(this);
    this.createModalInputOnChange = this.createModalInputOnChange.bind(this);
    this.create                   = this.create.bind(this);
    this.cancel                   = this.cancel.bind(this);
  }

  componentWillMount() {
    // FIXME using init action instead
    this.setState({ dataSource: apiModelsDataSource(), columns: modelsColumns });
  }

  openCreate() {
    this.setState({ models: { create: { visible: true } } });
  }

  create() {
    const { models: { create: { name } } } = this.state;
    const { dispatch }                     = this.props;
    console.log('try saving model by name', name);
    dispatch(modModelsActions.save(name));
  }

  createModalInputOnChange(event) {
    const { value } = event.target;
    this.setState({ models: { create: { visible: true, name: value } } });
  }

  cancel() {
    this.setState({ models: { create: { visible: false } } });
  }

  render() {
    const { dataSource, columns, models: { create: { visible } } } = this.state;

    return (
      <div>
        <Button onClick={this.openCreate}>新增</Button>
        <Button>刷新</Button>
        <hr />
        <Table dataSource={dataSource} columns={columns} />

        <Modal name="新增模型" visible={visible} onOk={this.create} onCancel={this.cancel}>
          <Input placeholder="输入模型名称" onChange={this.createModalInputOnChange} />
        </Modal>
      </div>
    );
  }
}

const mapStateToProps = state => ({ ...state.mod_models });

export default connect(mapStateToProps)(ModelsIndex);
