// @ts-nocheck

import React from 'react';
import { Paragraph } from '@contentful/forma-36-react-components';

//import { PlainClientAPI } from 'contentful-management';
import { createClient } from 'contentful-management'
import { FieldExtensionSDK } from '@contentful/app-sdk';
import { useEffect, useState } from "react";

interface FieldProps {
  sdk: FieldExtensionSDK;
}
const CMATOKEN = "CFPAT-VLSyuX0lRDVtctQJvh11JeJtpZLo4DFPLJzYiRtBzZ8";

const Field = (props: FieldProps) => {
  // If you only want to extend Contentful's default editing experience
  // reuse Contentful's editor components
  // -> https://www.contentful.com/developers/docs/extensibility/field-editors/

  const contentful = require('contentful-management')
  const { sdk } = props;
  const thisFieldId = sdk.field.id 

  console.log ("Got field " + thisFieldId)
  
  let [jsonEditorConfig, setJsonEditorConfig]   = useState( { JSONSchema: {} });
  const cma = contentful.createClient(
    {
      accessToken: CMATOKEN,
    },
    {
      type: 'plain',
      defaults: {
        environmentId: sdk.ids.environment,
        spaceId: sdk.ids.space,
      },
    }
  )
  // Why doens't this work????? 
  // const cma = createClient(
  //   { apiAdapter: sdk.cmaAdapter },
  //   {
  //     type: 'plain',
  //     defaults: {
  //       environmentId: sdk.ids.environment,
  //       spaceId: sdk.ids.space,
  //     },
  //   }
  // )
  // const cma = contentful.createClient(
  //   { apiAdapter: sdk.cmaAdapter },
  //   {
  //     type: 'plain',
  //     defaults: {
  //       environmentId: sdk.ids.environment,
  //       spaceId: sdk.ids.space,
  //     },
  //   } 
  // )

  useEffect(() => {  // only on first load 
    sdk.window.startAutoResizer();
    // TODO - how to filter by title field? - this approach not great if we had many
   
    const dd = cma.entry.getMany({ query: {content_type: 'jsonSchema' }})
    .then ( (data) => {
      console.log("Got " + data.items.length)
      let arrItems = data.items 
      let jsonEntry = arrItems.filter( (item) => {
        return item.fields.title["en-US"] === thisFieldId
      })
  
      console.log(jsonEntry)
      if (jsonEntry.length === 1) {
  
        setJsonEditorConfig({ 
          JSONSchema: jsonEntry[0].fields.schema["en-US"]
        } )
      }
      
  
    }) 
    .catch(error => console.log(error.message));
  
    }, []) 

  //return <Paragraph>Hello Entry Field Component - david</Paragraph>;
  return <Paragraph>Schema is here{ JSON.stringify(jsonEditorConfig) } </Paragraph>;
};

export default Field;
