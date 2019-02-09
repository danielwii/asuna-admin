import React, { useState } from 'react';
import * as _ from 'lodash';
import { Col, Grid, Row } from '@jetbrains/ring-ui/components/grid/grid';
import Panel from '@jetbrains/ring-ui/components/panel/panel';
import Button from '@jetbrains/ring-ui/components/button/button';
import ButtonGroup, { Caption } from '@jetbrains/ring-ui/components/button-group/button-group';

export function DebugSettings(props) {
  const { modules } = props;
  const [, setState] = useState({});

  const resetLogger = () => {
    _.keys(modules).forEach(module => (modules[module] = 'warn'));
    setState({});
  };

  const setLoggerLevel = (module, level) => {
    modules[module] = level;
    setState({});
  };

  return (
    <div>
      <Grid>
        {_.map(modules, (level, module) => (
          <Row key={module}>
            <Col xs={2}>
              <div>
                {module}:{level}
              </div>
            </Col>
            <Col>
              <ButtonGroup>
                <Button
                  danger
                  active={level === 'error'}
                  onClick={() => setLoggerLevel(module, 'error')}
                >
                  {'Error'}
                </Button>
                <Button
                  danger
                  active={level === 'warn'}
                  onClick={() => setLoggerLevel(module, 'warn')}
                >
                  {'Warn'}
                </Button>
                <Button active={level === 'info'} onClick={() => setLoggerLevel(module, 'info')}>
                  {'Info'}
                </Button>
                <Button active={level === 'debug'} onClick={() => setLoggerLevel(module, 'debug')}>
                  {'Debug'}
                </Button>
                <Button active={level === 'trace'} onClick={() => setLoggerLevel(module, 'trace')}>
                  {'Trace'}
                </Button>
              </ButtonGroup>
            </Col>
          </Row>
        ))}
      </Grid>

      <Panel>
        <Button primary onClick={resetLogger}>
          {'Reset Logger'}
        </Button>
        {/*<Button>{'Cancel'}</Button>*/}
        {/*<Button onClick={resetLogger}>{'Reset'}</Button>*/}
      </Panel>
    </div>
  );
}
