import React       from 'react';
import PropTypes   from 'prop-types';
import { connect } from 'react-redux';

import { Button, Divider, Input, Modal, Table } from 'antd';

import { modelsColumns }         from '../../services/models';
import { SpringResponseAdapter } from '../../adapters/response';
import { modModelsActions }      from '../../store/modules/models.redux';
import { panesActions }          from '../../store/panes.redux';

class ModelsIndex extends React.Component {
  static propTypes = {
    models: PropTypes.shape({}),
  };

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

    this.createModalInputOnChange = this.createModalInputOnChange.bind(this);
    this.openCreate               = this.openCreate.bind(this);
    this.openSetup                = this.openSetup.bind(this);
    this.create                   = this.create.bind(this);
    this.cancel                   = this.cancel.bind(this);
  }

  componentWillMount() {
    const actions = (text, record) => (
      <span>
        <Button size="small" type="dashed" onClick={() => this.openSetup(record)}>配置</Button>
        <Divider type="vertical" />
      </span>
    );
    this.setState({ columns: modelsColumns(actions) });

    const { dispatch } = this.props;
    dispatch(modModelsActions.refreshModels());
  }

  openSetup(record) {
    const { dispatch } = this.props;
    dispatch(panesActions.open({
      key  : `models::setup::${record.id}`,
      title: `配置模型 '${record.name}'`,
      data : record,
    }));
  }

  openCreate() {
    this.setState({ models: { create: { visible: true } } });
  }

  create() {
    const { models: { create: { name } } } = this.state;
    const { dispatch }                     = this.props;
    console.log('try saving model by name', name);
    dispatch(modModelsActions.save(name));
    this.setState({ models: { create: { visible: false } } });
  }

  createModalInputOnChange(event) {
    const { value } = event.target;
    this.setState({ models: { create: { visible: true, name: value } } });
  }

  cancel() {
    this.setState({ models: { create: { visible: false } } });
  }

  render() {
    const { columns, models: { create: { visible } } } = this.state;

    const { models } = this.props;

    // const dataSource     = _.get(models, 'content', []);
    const { items: dataSource, pagination } = new SpringResponseAdapter().extract(models);

    return (
      <div>
        <Button onClick={this.openCreate}>新增</Button>
        <Divider type="vertical" />
        <Button onClick={() => this.props.dispatch(modModelsActions.refreshModels())}>刷新</Button>

        <hr />
        <Table dataSource={dataSource} rowKey="id" columns={columns} pagination={pagination} />

        <Modal name="新增模型" visible={visible} onOk={this.create} onCancel={this.cancel}>
          <Input placeholder="输入模型名称" onChange={this.createModalInputOnChange} />
        </Modal>
      </div>
    );
  }
}

const mapStateToProps = state => ({ ...state.mod_models });

export default connect(mapStateToProps)(ModelsIndex);
