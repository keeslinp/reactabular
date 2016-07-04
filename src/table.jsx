import get from 'lodash/get';
import has from 'lodash/has';
import React from 'react';
import tableTypes from './types';
import {
  resolveHeaderRows, evaluateTransforms, mergeClassNames,
  resolveBodyColumns
} from './utils';

class Table extends React.Component {
  getChildContext() {
    return {
      columns: this.props.columns,
      data: this.props.data,
      rowKey: this.props.rowKey
    };
  }
  render() {
    const {
      columns, data, children, ...props // eslint-disable-line no-unused-vars
    } = this.props;

    return <table {...props}>{children}</table>;
  }
}
Table.propTypes = {
  ...tableTypes,
  children: React.PropTypes.any
};
Table.childContextTypes = tableTypes;

// This has to be a React component instead of a function.
// Otherwise refs won't work.
class Header extends React.Component { // eslint-disable-line react/prefer-stateless-function
  render() {
    const { children, className, ...props } = this.props;
    const { columns } = this.context;

    return (
      <thead {...props}>{
        resolveHeaderRows(columns).map((headerRow, i) => (
          <tr key={`${i}-header-row`}>{
            headerRow.map((column, j) => {
              const columnProps = column.props || {};
              const {
                label,
                transforms = [() => ({})],
                format = a => a,
                component = 'th',
                props // eslint-disable-line no-shadow
              } = column.header || {};
              const extraParameters = {
                columnIndex: j,
                column,
                rowData: label
              };
              const key = `${j}-header`;
              const transformed = evaluateTransforms(transforms, label, extraParameters);

              if (!transformed) {
                console.warn('Table.Header - Failed to receive a transformed result'); // eslint-disable-line max-len, no-console
              }

              const mergedClassName = mergeClassNames(
                className, transformed && transformed.className
              );

              return React.createElement(
                component,
                {
                  key,
                  ...columnProps,
                  ...props,
                  ...transformed,
                  ...{ className: mergedClassName }
                },
                transformed.children || format(label, extraParameters)
              );
            })
          }
          </tr>
        )
      )}
      {children}
      </thead>
    );
  }
}
Header.propTypes = {
  className: React.PropTypes.string,
  children: React.PropTypes.any
};
Header.contextTypes = {
  columns: tableTypes.columns
};
Header.displayName = 'Table.Header';

// This has to be a React component instead of a function.
// Otherwise refs won't work.
class Body extends React.Component { // eslint-disable-line react/prefer-stateless-function
  render() {
    const { row, className, ...props } = this.props;
    const { columns, data, rowKey } = this.context;
    const dataColumns = resolveBodyColumns(columns);

    return (
      <tbody {...props}>{
        data.map((r, i) => <tr key={`${r[rowKey] || i}-row`} {...row(r, i)}>{
          dataColumns.map((column, j) => {
            const columnProps = column.props || {};
            const {
              property,
              transforms = [() => ({})],
              format = a => a,
              resolve = a => a,
              component = 'td',
              props // eslint-disable-line no-shadow
            } = column.cell || {};
            if (property && !has(r, property)) {
              console.warn(`Table.Body - Failed to find "${property}" property from`, r); // eslint-disable-line max-len, no-console
            }

            const extraParameters = {
              columnIndex: j,
              column,
              rowData: data[i],
              rowIndex: i,
              property
            };
            const value = get(r, property);
            const resolvedValue = resolve(value, extraParameters);
            const transformed = evaluateTransforms(transforms, value, extraParameters);

            if (!transformed) {
              console.warn('Table.Body - Failed to receive a transformed result'); // eslint-disable-line max-len, no-console
            }

            const mergedClassName = mergeClassNames(
              className, transformed && transformed.className
            );

            return React.createElement(
              component,
              {
                key: `${j}-cell`,
                ...columnProps,
                ...props,
                ...transformed,
                ...{ className: mergedClassName }
              },
              transformed.children || format(resolvedValue, extraParameters)
            );
          })
        }</tr>)
      }</tbody>
    );
  }
}
Body.propTypes = {
  row: React.PropTypes.func,
  className: React.PropTypes.string
};
Body.defaultProps = {
  row: () => {}
};
Body.contextTypes = tableTypes;
Body.displayName = 'Table.Body';

Table.Header = Header;
Table.Body = Body;

export default Table;
