// @ts-nocheck
import React, { useState, useEffect } from "react";
import {
  Paragraph,
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

function SchemaField({
  name,
  type,
  description,
  value,
  onChange,
  noSpacing = false,
}) {
  return (
    <Flex marginBottom={noSpacing ? "none" : "spacingL"} fullWidth>
      <Flex flexGrow="1" flexDirection="column">
        {["string", "number", "integer"].includes(type) && (
          <>
            {name && <FormLabel>{name}</FormLabel>}
            <TextInput
              // required
              labelText={name || ""}
              value={value || ""}
              helpText={description || null}
              onChange={(e) => onChange(e.target.value)}
            />
          </>
        )}

        {["boolean"].includes(type) && (
          <CheckboxField
            labelText={name || "Switch on"}
            checked={value || false}
            value="yes"
            onChange={(e) => {
              onChange(!value);
            }}
          />
        )}
      </Flex>
    </Flex>
  );
}

function SchemaArray({ name, items, defs, value = [], onChange }) {
  let entries = [...value];

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

  return (
    <Flex marginBottom="spacingL" flexGrow="1">
      <Flex flexGrow="1" flexDirection="column">
        <FormLabel>{name}</FormLabel>
        {entries.map((val, index) => (
          <>
            {/* Handle basic field types */}
            {typeof items.type !== "undefined" && (
              <Flex
                flexWrap="nowrap"
                marginBottom="spacingXs"
                alignItems="center"
              >
                <Flex flexGrow="1" paddingRight="spacingS">
                  <SchemaForm
                    schema={items}
                    defs={defs}
                    value={val}
                    onChange={(newValue) => handleChange(newValue, index)}
                    noSpacing
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
              <Flex marginBottom="spacingXs" flexGrow="1">
                <Card style={{ flexGrow: "1" }}>
                  <Flex flexWrap="wrap" marginBottom="spacingXs">
                    <Flex flexGrow="1" paddingRight="spacingS">
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

  return (
    <Flex flexDirection="column" flexGrow="1">
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

function SchemaForm({
  name = null,
  schema,
  defs = {},
  onChange,
  value,
  noSpacing = false,
}) {
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
          noSpacing={noSpacing}
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

  // See if we already have a field value
  const initialValue = sdk.field.getValue();
  
  const [value, setValue] = useState(initialValue);

  const handleChange = (newValue) => {
    // Set the field value first
    sdk.field.setValue(newValue).then(console.log).catch(console.log);

    if (typeof newValue === "object") {
      setValue({ ...newValue });
      return;
    }
    setValue(newValue);
  };

  // Start the auto resizer so the field only takes up the space it needs
  window.startAutoResizer();

  const thisFieldId = sdk.field.id;

  let [jsonEditorConfig, setJsonEditorConfig] = useState({ JSONSchema: {} });
  
  const cma = createClient(
    { apiAdapter: sdk.cmaAdapter },
    {
      type: 'plain',
      defaults: {
        environmentId: sdk.ids.environment,
        spaceId: sdk.ids.space,
      },
    }
  );

  useEffect(() => {
    // TODO - how to filter by title field? - this approach not great if we had many
    cma.entry
      .getMany({ query: { content_type: "jsonSchema" } })
      .then((data) => {
        let arrItems = data.items;
        let jsonEntry = arrItems.filter((item) => {
          return item.fields.title["en-US"] === thisFieldId;
        });

        if (jsonEntry.length === 1) {
          // Set the initial value if necessary
          setValue(sdk.field.getValue() || schemaGetInitialValue(jsonEntry[0].fields.schema["en-US"]));
          setJsonEditorConfig({
            JSONSchema: jsonEntry[0].fields.schema["en-US"],
          });
          
        }
      })
      .catch((error) => console.log(error.message));
  }, []);

  return <SchemaForm schema={jsonEditorConfig.JSONSchema} onChange={handleChange} value={value} />;
};

export default Field;
