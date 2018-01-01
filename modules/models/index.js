import React       from 'react';
import PropTypes   from 'prop-types';
import { connect } from 'react-redux';
import _           from 'lodash';

import { Button, Divider, Input, Modal, Table } from 'antd';

import { toPagination }     from '../../services/utils';
import { modelsColumns }    from '../../services/models';
import { modModelsActions } from '../../store/modules/models.redux';

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

    this.openCreate               = this.openCreate.bind(this);
    this.createModalInputOnChange = this.createModalInputOnChange.bind(this);
    this.create                   = this.create.bind(this);
    this.cancel                   = this.cancel.bind(this);
  }

  componentWillMount() {
    const actions = (text, record) => (
      <span>

        {/* <a href="#">Action 一 {record.name}</a> */}
        <Divider type="vertical" />
        {/* <a href="#">Delete</a> */}
        <Divider type="vertical" />
        {/* <a href="#" className="ant-dropdown-link"> */}
        {/* More actions <Icon type="down" /> */}
        {/* </a> */}
      </span>
    );
    this.setState({ columns: modelsColumns(actions) });
    const { dispatch } = this.props;
    dispatch(modModelsActions.refreshModels());
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
    const dataSource = _.get(models, 'content', []);

    const pagination = toPagination(models);

    return (
      <div>
        <Button onClick={this.openCreate}>新增</Button>
        <Divider type="vertical" />
        <Button onClick={() => this.props.dispatch(modModelsActions.refreshModels())}>刷新</Button>
        <hr />
        <Table dataSource={dataSource} columns={columns} pagination={pagination} />

        <Modal name="新增模型" visible={visible} onOk={this.create} onCancel={this.cancel}>
          <Input placeholder="输入模型名称" onChange={this.createModalInputOnChange} />
        </Modal>
      </div>
    );
  }
}

const mapStateToProps = state => ({ ...state.mod_models });

export default connect(mapStateToProps)(ModelsIndex);
