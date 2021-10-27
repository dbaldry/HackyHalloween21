// import React from 'react';
// import { List, ListItem, Heading, Paragraph } from '@contentful/forma-36-react-components';
// import { Divider } from '../Divider';
// import { styles } from './styles';

// export const ConfigurationContent = () => (
//   <>


    
//   </>
// );
import * as React from 'react';

import get from 'lodash/get';
import { AppExtensionSDK } from '@contentful/app-sdk';
import {
  Heading,
  Paragraph,
  Typography,
  TextField,
  Form
} from '@contentful/forma-36-react-components';

import FieldSelector from './FieldSelector';

import { parameterDefinitions, toInputParameters, toAppParameters } from './parameters';
import {
  getCompatibleFields,
  editorInterfacesToSelectedFields,
  selectedFieldsToTargetState,
  CompatibleFields,
  FieldsConfig
} from './fields';
import { validateParameters } from './parameters';

import { styles } from './styles';

import { Hash, EditorInterface,  ContentType } from '../interfaces';
import logo from '../logo.svg';
import { FieldTypeInstructions } from './FieldTypeInstructions';

// interface Props {
//   sdk: AppExtensionSDK;
// }

// interface State {
//   contentTypes: ContentType[];
//   compatibleFields: CompatibleFields;
//   selectedFields: FieldsConfig;
//   parameters: Hash;
// }
//export default class ConfigurationContent extends React.Component<Props, State> {
  export default class ConfigurationContent extends React.Component {
//export default class AppConfig extends React.Component<Props, State> {
  state = {
    contentTypes: [],
    compatibleFields: {},
    selectedFields: {},
    parameters: toInputParameters(parameterDefinitions, null)
  };

  async componentDidMount() {
    const { space, app, ids } = this.props.sdk;

    app.onConfigure(this.onAppConfigure);

    const [contentTypesResponse, eisResponse, parameters] = await Promise.all([
      space.getContentTypes(),
      space.getEditorInterfaces(),
      app.getParameters()
    ]);

    const fieldsConfig = get(parameters, ['fieldsConfig'], {});

    //const contentTypes = (contentTypesResponse as Hash).items as ContentType[];
    //const editorInterfaces = (eisResponse as Hash).items as EditorInterface[];
    const contentTypes = (contentTypesResponse).items
    const editorInterfaces = (eisResponse).items 

    const compatibleFields = getCompatibleFields(contentTypes);
    const filteredContentTypes = contentTypes.filter(ct => {
      const fields = compatibleFields[ct.sys.id];
      return fields && fields.length > 0;
    });

    // eslint-disable-next-line react/no-did-mount-set-state
    this.setState(
      {
        contentTypes: filteredContentTypes,
        compatibleFields,
        selectedFields: editorInterfacesToSelectedFields(editorInterfaces, fieldsConfig, ids.app),
        parameters: toInputParameters(parameterDefinitions, parameters)
      },
      () => app.setReady()
    );
  }

  onAppConfigure = () => {
    const { contentTypes, selectedFields } = this.state;
    const parameters = {
      ...toAppParameters(parameterDefinitions, this.state.parameters),
      fieldsConfig: selectedFields
    };

    const error = validateParameters(parameters);

    if (error) {
      this.props.sdk.notifier.error(error);
      return false;
    }

    return {
      parameters,
      targetState: selectedFieldsToTargetState(contentTypes, selectedFields)
    };
  };

  // onParameterChange = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    onParameterChange = (key, e ) => {
    const { value } = e.currentTarget;

    this.setState(state => ({
      parameters: { ...state.parameters, [key]: value }
    }));
  };

  //onSelectedFieldsChange = (selectedFields: FieldsConfig) => {
  onSelectedFieldsChange = (selectedFields) => {
    this.setState({ selectedFields });
  };

  render() {
    const { contentTypes, compatibleFields, selectedFields, parameters } = this.state;
    const { sdk } = this.props;
  console.log("wtf")
  console.log (this)
    const {
      ids: { space, environment }
    } = sdk;
    console.log(sdk)
    
    // const  sdk  = this.props.sdk;
    
    // const space = sdk.ids.space 
    // const environment = sdk.ids.environment 
    // return (
    //   <div className={styles.background}>
    //     <div className={styles.body}>
    //       <Typography>
    //         <Heading>About No Code JSON editor</Heading>
    //         <Paragraph>
    //           The No Code JSON editor enables users to create json that conforms to a defined schema. 
    //         </Paragraph>

    //         <hr className={styles.splitter} />

    //         <Heading>Configuration</Heading>
    //         <Paragraph>
    //           David instructions here 
    //         </Paragraph>
    //         <Form>
    //           {parameterDefinitions.map(def => {
    //             const key = `config-input-${def.id}`;
    //             return (
    //               <TextField
    //                 required={def.required}
    //                 key={key}
    //                 id={key}
    //                 name={key}
    //                 labelText={def.name}
    //                 textInputProps={{
    //                   width: 'large',
    //                   maxLength: 255
    //                 }}
    //                 helpText={def.description}
    //                 value={parameters[def.id]}
    //                 onChange={this.onParameterChange.bind(this, def.id)}
    //               />
    //             );
    //           })}
    //         </Form>

    //         <hr className={styles.splitter} />

    //         <FieldTypeInstructions
    //           space={space}
    //           environment={environment}
    //           contentTypesFound={contentTypes.length > 0}
    //         />
    //         <FieldSelector
    //           contentTypes={contentTypes}
    //           compatibleFields={compatibleFields}
    //           selectedFields={selectedFields}
    //           onSelectedFieldsChange={this.onSelectedFieldsChange}
    //         />
    //       </Typography>
    //     </div>
    //     <div className={styles.icon}>
    //       <img src={logo} alt="App logo" />
    //     </div>
    //   </div>
    // );
    return (
     
          <Typography>
            <Heading>Configuration</Heading>
            <Paragraph>
              To configure the No Code JSON editor, add json fields to content types. 
              Specify this app as the editor (the appearance tab), and create a content entry
              of the type you specified (i.e. JSONschema) and with the name of the field. 
            </Paragraph>

            <hr className={styles.splitter} />

          </Typography>
        
    );
  }
}
