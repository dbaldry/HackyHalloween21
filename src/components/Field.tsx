// @ts-nocheck
import React, { useState, useEffect } from "react";
import {
  Paragraph,
  TextField,
  CheckboxField,
  FormLabel,
  TextInput,
  Card,
  Flex,
  Button,
} from "@contentful/forma-36-react-components";
import { FieldExtensionSDK } from "@contentful/app-sdk";
import { createClient } from "contentful-management";

interface FieldProps {
  sdk: FieldExtensionSDK;
}
const CMATOKEN = "CFPAT-VLSyuX0lRDVtctQJvh11JeJtpZLo4DFPLJzYiRtBzZ8";

/**
 * JSON Schema Types:
 * - string
 * - number
 * - integer
 * - object
 * - array
 * - boolean
 * - null
 */

// Dummy schema for use
const rawSchema = `{
  "$id": "https://example.com/arrays.schema.json",
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "description": "A representation of a person, company, organization, or place",
  "type": "object",
  "properties": {
    "textFieldExample": {
      "type": "string"
    },
    "boolExample": {
      "type": "boolean"
    },
    "fruits": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "vegetables": {
      "type": "array",
      "items": { "$ref": "#/$defs/veggie" }
    }
  },
  "$defs": {
    "veggie": {
      "type": "object",
      "required": [ "veggieName", "veggieLike" ],
      "properties": {
        "veggieName": {
          "type": "string",
          "description": "The name of the vegetable."
        },
        "veggiesLike": {
          "type": "boolean",
          "description": "Do I like this vegetable?"
        }
      }
    },
    "dish": {
      "type": "object",
      "properties": {
        "dishName": {
          "type": "string",
          "description": "The name of the dish."
        },
        "forBeginners": {
          "type": "boolean",
          "description": "Is this an easy dish?"
        }
      }
    }
  }
}`;

function SchemaField({ name, type, description, value, onChange }) {
  switch (type) {
    case "string":
    case "number": // TODO: Better field type for number??
    case "integer": // TODO: Better field type for integer??
      return (
        <Flex marginBottom="spacingL">
          <Flex flexGrow="1">
            <TextField
              // required
              labelText={name || null}
              value={value || ""}
              helpText={description || null}
              onChange={(e) => onChange(e.target.value)}
            />
          </Flex>
        </Flex>
      );

    case "boolean":
      return (
        <Flex marginBottom="spacingL">
          <Flex flexGrow="1">
            <CheckboxField
              labelText={name || "Switch on"}
              checked={value || false}
              value="yes"
              onChange={(e) => {
                console.log(e);
                onChange(!value);
              }}
              id="termsCheckbox"
            />
          </Flex>
        </Flex>
      );
  }
}

function SchemaArray({ name, items, defs, value, onChange }) {
  let entries = [...value];
  console.log("ENTRIES", entries);

  const handleAddItem = () => {
    if (typeof items.$ref !== "undefined") {
      entries.push({});
    } else {
      entries.push("");
    }
    onChange(entries);
  };

  const handleRemoveItem = (index) => {
    entries.splice(index, 1);
    onChange(entries);
  };

  const handleChange = (newValue, index) => {
    entries[index] = newValue;
    onChange(entries);
  };

  // TODO: Handle numbers and integers better??
  return (
    <Flex marginBottom="spacingL" flexGrow="1">
      <Flex flexGrow="1" flexDirection="column">
        <FormLabel>{name}</FormLabel>
        {entries.map((val, index) => (
          <>
            {/* Handle basic field types */}
            {typeof items.type !== "undefined" && (
              <Flex flexWrap="nowrap" marginBottom="spacingXs">
                <Flex flexGrow="1" paddingRight="spacingS">
                  <SchemaForm
                    schema={items}
                    defs={defs}
                    value={val}
                    onChange={(newValue) => handleChange(newValue, index)}
                  />
                </Flex>
                <Flex>
                  <Button
                    icon="Minus"
                    buttonType="muted"
                    onClick={() => {
                      handleRemoveItem(index);
                    }}
                  />
                </Flex>
              </Flex>
            )}

            {/* Handle complex field types */}
            {typeof items.$ref !== "undefined" && (
              <Flex marginBottom="spacingM" flexGrow="1">
                <Card style={{ flexGrow: "1" }}>
                  <Flex flexWrap="wrap" marginBottom="spacingXs">
                    <Flex flexGrow="1">
                      <SchemaForm
                        schema={defs[items.$ref.split("/").at(-1)]}
                        defs={defs}
                        value={val}
                        onChange={(newValue) => handleChange(newValue, index)}
                        inline
                      />
                    </Flex>
                    <Flex flexGrow="0">
                      <Button
                        icon="Minus"
                        buttonType="muted"
                        onClick={() => {
                          handleRemoveItem(index);
                        }}
                      />
                    </Flex>
                  </Flex>
                </Card>
              </Flex>
            )}
          </>
        ))}
        <Flex flexWrap="nowrap">
          <Button
            icon="Plus"
            size="small"
            buttonType="primary"
            onClick={handleAddItem}
          >
            Add
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
}

function SchemaObject({ name, properties, defs, value, onChange }) {
  // Iterate through each property and create a form from each
  const propertyKeys = Object.keys(properties);

  const handleChange = (newValue, key) => {
    value[key] = newValue;
    onChange(value);
  };
console.log (value)
  return (
    <Flex
      flexDirection={propertyKeys.length > 2 ? "column" : "row"}
      flexGrow="1"
    >
      {propertyKeys.map((key) => (
        <Flex flexGrow="1">
          <SchemaForm
            name={key}
            schema={properties[key]}
            defs={defs}
            value={value[key]}
            onChange={(newValue) => handleChange(newValue, key)}
          />
        </Flex>
      ))}
    </Flex>
  );
}

function SchemaForm({ name = null, schema, defs = {}, onChange, value }) {
  if (typeof schema?.$defs !== "undefined") {
    defs = { ...defs, ...schema.$defs };
  }

  switch (schema.type) {
    case "string":
    case "number":
    case "integer":
    case "boolean": 
      return (
        <SchemaField
          name={name}
          type={schema.type}
          description={schema.description}
          value={value}
          onChange={onChange}
        />
      );

    case "object":
      return (
        <SchemaObject
          name={name}
          properties={schema.properties}
          defs={defs}
          value={value}
          onChange={onChange}
        />
      );

    case "array":
      return (
        <SchemaArray
          name={name}
          items={schema.items}
          defs={defs}
          value={value}
          onChange={onChange}
        />
      );

    case "null":
    default:
      return <Paragraph>Schema type not supported</Paragraph>;
  }
}

function schemaGetInitialValue(schema) {
  switch (schema.type) {
    case "string":
    case "number":
    case "integer":
    case "boolean":
      return null;
    case "object":
      const objToReturn = {};
      const keys = Object.keys(schema.properties);
      for (var i = 0; i < keys.length; i++) {
        objToReturn[keys[i]] = schemaGetInitialValue(
          schema.properties[keys[i]]
        );
      }
      return objToReturn;
    case "array":
      return [];
    case "null":
    default:
      return null;
  }
}

const Field = (props: FieldProps) => {
  const {
    sdk,
    sdk: { window },
  } = props;

  const schema = {} // JSON.parse(rawSchema);

  const [value, setValue] = useState(schemaGetInitialValue(schema));

  const handleChange = (newValue) => {
    if (typeof newValue === "object") {
      setValue({ ...newValue });
      return;
    }
    setValue(newValue);
  };

  // Start the auto resizer so the field only takes up the space it needs
  window.startAutoResizer();

  const thisFieldId = sdk.field.id;

  console.log("Got field " + thisFieldId);

  let [jsonEditorConfig, setJsonEditorConfig] = useState({ JSONSchema: {} });
  const cma = createClient(
    {
      accessToken: CMATOKEN,
    },
    {
      type: "plain",
      defaults: {
        environmentId: sdk.ids.environment,
        spaceId: sdk.ids.space,
      },
    }
  );
  // Why doesn't this work?????
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

  useEffect(() => {
    // TODO - how to filter by title field? - this approach not great if we had many

    cma.entry
      .getMany({ query: { content_type: "jsonSchema" } })
      .then((data) => {
        let arrItems = data.items;
        let jsonEntry = arrItems.filter((item) => {
          return item.fields.title["en-US"] === thisFieldId;
        });

        console.log(jsonEntry);
        if (jsonEntry.length === 1) {
          console.log (jsonEntry[0].fields.schema["en-US"])
          setJsonEditorConfig({
            JSONSchema: jsonEntry[0].fields.schema["en-US"],
          });
          
        }
      })
      .catch((error) => console.log(error.message));
  }, []);

  // useEffect(() => {
  //   console.log("schema changed")
  //   const schema = jsonEditorConfig.JSONSchema
  //   console.log("Using schema " + JSON.stringify(schema))
  //   setValue ( schemaGetInitialValue(schema))
  
  // }, [jsonEditorConfig]);

  return (
    <>
      <div style={{ background: "black", color: "white" }}>
        {JSON.stringify(value)}
      </div>
      <SchemaForm schema={jsonEditorConfig.JSONSchema} onChange={handleChange} value={value} />
    </>
  );
};

export default Field;
