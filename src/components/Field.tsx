// @ts-nocheck
import React, { useState, useEffect } from "react";
import {
  Paragraph,
  CheckboxField,
  FormLabel,
  TextInput,
  Card,
  Flex,
  HelpText,
  Button,
  Tooltip,
  TextLink,
  Tag,
  FieldGroup,
  Select,
  Option,
  EditorToolbar,
  Table,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from "@contentful/forma-36-react-components";
import { FieldExtensionSDK } from "@contentful/app-sdk";
import { createClient } from "contentful-management";

interface FieldProps {
  sdk: FieldExtensionSDK;
}

function SchemaField({
  name = null,
  title = null,
  type,
  description = null,
  value,
  onChange,
  noSpacing = false,
}) {
  console.log(title, name);
  const label = title ? title : name;

  return (
    <Flex marginBottom={noSpacing ? "none" : "spacingL"} fullWidth>
      <Flex flexGrow="1" flexDirection="column">
        {["string", "number", "integer"].includes(type) && (
          <>
            {label && <FormLabel>{label}</FormLabel>}
            <TextInput
              // required
              labelText={name || ""}
              value={value || ""}
              helpText={description || null}
              onChange={(e) => onChange(e.target.value)}
              className={description ? "f36-margin-bottom--xs" : ""}
            />
            {description && <HelpText>{description}</HelpText>}
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

function SchemaArray({
  name,
  title = null,
  description = null,
  items,
  defs,
  value = [],
  onChange,
}) {
  let entries = [];
  if (typeof value == "object" && value.length > 0) entries = [...value];

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
        <FormLabel>
          {title || name}{" "}
          {description && (
            <Tooltip content={description}>
              <Tag>?</Tag>
            </Tooltip>
          )}
        </FormLabel>
        <Table>
          <TableBody>
            {entries.map((val, index) => (
              <TableRow>
                <TableCell style={{ width: "99%" }}>
                  {/* Handle basic field types */}
                  {typeof items.type !== "undefined" && (
                    <SchemaForm
                      schema={items}
                      defs={defs}
                      value={val}
                      onChange={(newValue) => handleChange(newValue, index)}
                      noSpacing
                    />
                  )}

                  {/* Handle complex field types */}
                  {typeof items.$ref !== "undefined" && (
                    <SchemaForm
                      schema={defs[items.$ref.split("/").at(-1)]}
                      defs={defs}
                      value={val}
                      onChange={(newValue) => handleChange(newValue, index)}
                      inline
                    />
                  )}
                </TableCell>
                <TableCell style={{ textAlign: "right" }}>
                  <Button
                    icon="Delete"
                    buttonType="muted"
                    size="small"
                    onClick={() => {
                      handleRemoveItem(index);
                    }}
                  >
                    Remove
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell style={{ background: "#e7ebee" }} colSpan="2">
                <Button
                  icon="Plus"
                  size="small"
                  buttonType="primary"
                  isFullWidth={false}
                  onClick={handleAddItem}
                >
                  Add
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Flex>
    </Flex>
  );
}

function SchemaObject({
  name,
  title = null,
  description = null,
  properties,
  defs,
  value,
  onChange,
}) {
  // Iterate through each property and create a form from each
  const propertyKeys = Object.keys(properties);

  const handleChange = (newValue, key) => {
    value[key] = newValue;
    onChange(value);
  };

  return (
    <Flex flexGrow="1">
      <Flex flexGrow="1" flexDirection="column">
        {(title || name) && (
          <FormLabel>
            {title || name}{" "}
            {description && (
              <Tooltip content={description}>
                <Tag>?</Tag>
              </Tooltip>
            )}
          </FormLabel>
        )}
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
      </Flex>
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
          title={schema.title || null}
          type={schema.type}
          description={schema.description || null}
          value={value}
          onChange={onChange}
          noSpacing={noSpacing}
        />
      );

    case "object":
      return (
        <SchemaObject
          name={name}
          title={schema.title || null}
          description={schema.description || null}
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
          title={schema.title || null}
          description={schema.description || null}
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
  return schemaBuild("helloWorld", schemaGen(schema));
}

function schemaBuild(schemaName, data) {
  return {
    schema: schemaName,
    data,
  };
}

function schemaGen(schema) {
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
        objToReturn[keys[i]] = schemaGen(schema.properties[keys[i]]);
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

  console.log(initialValue);

  const [value, setValue] = useState(initialValue);
  const [schemas, setSchemas] = useState([]);
  const [jsonEditorConfig, setJsonEditorConfig] = useState();

  const handleChange = (newValue) => {
    // Add the extra json
    newValue = schemaBuild(jsonEditorConfig.schemaName, newValue);

    // Set the field value first
    sdk.field.setValue(newValue).then(console.log).catch(console.log);

    // if (typeof newValue === "object") {
    //   // Is it an array?
    //   if (Object.prototype.toString.call(newValue) === "[object Array]") {
    //     setValue([...newValue]);
    //     return;
    //   }

    //   // It must be an object then
    //   setValue({ ...newValue });
    //   return;
    // }

    // // String or number or bool can be handled like this
    // setValue(newValue);

    setValue(newValue);
  };

  // Start the auto resizer so the field only takes up the space it needs
  window.startAutoResizer();

  const thisFieldId = sdk.field.id;

  const cma = createClient(
    { apiAdapter: sdk.cmaAdapter },
    {
      type: "plain",
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
        // Create the list of Schemas
        setSchemas(data.items);

        // let arrItems = data.items;
        // let jsonEntry = arrItems.filter((item) => {
        //   return item.fields.title["en-US"] === thisFieldId;
        // });

        // if (jsonEntry.length === 1) {
        //   // Set the initial value if necessary
        //   setValue(
        //     sdk.field.getValue() ||
        //       schemaGetInitialValue(jsonEntry[0].fields.schema["en-US"])
        //   );
        //   setJsonEditorConfig({
        //     JSONSchema: jsonEntry[0].fields.schema["en-US"],
        //   });
        // }

        // Initial setup if we have content already
        if(value) {
          const item = data.items.filter(i => i.fields.title["en-US"] === value.schema);
          setJsonEditorConfig({
            schemaName: value.schema,
            JSONSchema: item[0].fields.schema["en-US"]
          });
        }
      })
      .catch((error) => console.log(error.message));
  }, []);  

  const handleChooseSchema = (e) => {
    const schemaName = e.target.value;

    // Find the schema in the array
    const schema = schemas.filter((item) => {
      return item.fields.title["en-US"] === schemaName;
    });

    // Because we're changing the schema we need to reset the value of the field
    setValue(
      schemaGetInitialValue(schema[0].fields.schema["en-US"])
    );

    setJsonEditorConfig({
      schemaName: schema[0].fields.title["en-US"],
      JSONSchema: schema[0].fields.schema["en-US"],
    });
  };

  return (
    <div style={{ marginTop: "0.5rem" }}>
      <EditorToolbar>
        <Select width="medium" value={value ? value.schema : ""} onChange={handleChooseSchema}>
          <Option>Choose Data Type</Option>
          <Option>---</Option>
          {schemas.map((schema) => (
            <Option>{schema.fields.title["en-US"]}</Option>
          ))}
        </Select>
      </EditorToolbar>
      {jsonEditorConfig && (
        <div
          style={{
            border: "1px solid #aec1cc",
            borderTop: "none",
            padding: "1rem",
            borderRadius: "0 0 6px 6px",
            paddingBottom: "-20px",
          }}
        >
          <SchemaForm
            schema={jsonEditorConfig.JSONSchema}
            onChange={handleChange}
            value={value.data}
          />
        </div>
      )}
    </div>
  );
};

export default Field;
