import { describe, expect, it } from 'vitest';
import { createBuilderNode, getComponentDefinition, getComponentsByCategory } from '@/metadata';
import { generateLwcHtml } from '@/generator';
import { isPropertyVisible, visibleProperties } from '@/utils/propertyVisibility';
import {
  asObjectList,
  moveListItem,
  seedRequiredVisibleDefaults,
  setObjectField,
} from '@/utils/objectList';
import {
  createDatatableColumn,
  DATATABLE_NON_EDITABLE_TYPES,
  defaultDatatableColumns,
  defaultDatatableRowActions,
  normalizeDatatableColumns,
  toSalesforceColumns,
} from '@/metadata/datatable/columns';
import { createDatatableSampleRows } from '@/metadata/datatable/sampleRows';
import { buildDatatableViewModel, formatDatatableCell } from '@/metadata/datatable/viewModel';

function datatableDef() {
  const def = getComponentDefinition('lightning-datatable');
  expect(def).toBeDefined();
  return def!;
}

function columnSchema() {
  const columns = datatableDef().properties.find((property) => property.name === 'columns');
  expect(columns?.itemSchema).toBeDefined();
  return columns!.itemSchema!;
}

describe('lightning-datatable metadata', () => {
  it('registers the Salesforce component in the Display category', () => {
    const def = datatableDef();
    expect(def.salesforceName).toBe('lightning-datatable');
    expect(def.output.tagName).toBe('lightning-datatable');
    expect(def.category).toBe('Display');
    expect(def.composition.acceptsChildren).toBe(false);
    expect(def.composition.allowAtRoot).not.toBe(false);
    expect(getComponentsByCategory('Display').some((item) => item.type === 'lightning-datatable')).toBe(
      true
    );
  });

  it('uses Salesforce default key-field and JS bindings for data and columns', () => {
    const def = datatableDef();
    expect(def.defaultAttributes['key-field']).toBe('Id');
    expect(def.defaultAttributes.data).toBe('data');
    expect(Array.isArray(def.defaultAttributes.columns)).toBe(true);

    const data = def.properties.find((property) => property.name === 'data');
    const columns = def.properties.find((property) => property.name === 'columns');
    expect(data?.outputKind).toBe('binding');
    expect(data?.jsBinding).toBe('data');
    expect(columns?.outputKind).toBe('binding');
    expect(columns?.jsBinding).toBe('columns');
    expect(columns?.type).toBe('object-list');
  });

  it('hides hide-borders unless hide-table-header is true', () => {
    const def = datatableDef();
    const hideBorders = def.properties.find((property) => property.name === 'hide-borders');
    expect(hideBorders).toBeDefined();
    expect(isPropertyVisible(hideBorders!, { 'hide-table-header': false })).toBe(false);
    expect(isPropertyVisible(hideBorders!, { 'hide-table-header': true })).toBe(true);
  });

  it('hides load-more-offset unless infinite loading is enabled', () => {
    const names = visibleProperties(datatableDef(), { 'enable-infinite-loading': false }).map(
      (property) => property.name
    );
    expect(names).not.toContain('load-more-offset');
    expect(
      visibleProperties(datatableDef(), { 'enable-infinite-loading': true }).some(
        (property) => property.name === 'load-more-offset'
      )
    ).toBe(true);
  });

  it('exposes the official public attributes added for fidelity', () => {
    const names = datatableDef().properties.map((property) => property.name);
    expect(names).toEqual(
      expect.arrayContaining([
        'show-actions-menu',
        'resize-step',
        'disabled-rows',
        'draft-values',
        'errors',
        'aria-labelled-by',
        'aria-describedby',
        'onheaderaction',
        'onresize',
      ])
    );

    const disabledRows = datatableDef().properties.find((property) => property.name === 'disabled-rows');
    const draftValues = datatableDef().properties.find((property) => property.name === 'draft-values');
    const errors = datatableDef().properties.find((property) => property.name === 'errors');
    expect(disabledRows?.outputKind).toBe('binding');
    expect(draftValues?.outputKind).toBe('binding');
    expect(errors?.outputKind).toBe('binding');

    const headerAction = datatableDef().properties.find((property) => property.name === 'onheaderaction');
    const resize = datatableDef().properties.find((property) => property.name === 'onresize');
    expect(headerAction?.outputKind).toBe('event');
    expect(resize?.outputKind).toBe('event');
  });
});

describe('datatable columns', () => {
  it('creates a text column by default', () => {
    const column = createDatatableColumn();
    expect(column.type).toBe('text');
    expect(column.label).toBe('New Column');
    expect(column.fieldName).toBe('Field');
  });

  it('normalizes invalid column values to an empty list', () => {
    expect(normalizeDatatableColumns(undefined)).toEqual([]);
    expect(normalizeDatatableColumns('not-an-array')).toEqual([]);
    expect(normalizeDatatableColumns([null, 'x', { label: 'Name', fieldName: 'Name' }])).toEqual([
      expect.objectContaining({ label: 'Name', fieldName: 'Name', type: 'text' }),
    ]);
  });

  it('fills missing label, fieldName, and type', () => {
    const [column] = normalizeDatatableColumns([{}]);
    expect(column?.label).toBe('Column 1');
    expect(column?.fieldName).toBe('Field1');
    expect(column?.type).toBe('text');
  });

  it('removes a column by index', () => {
    const columns = defaultDatatableColumns();
    const next = columns.filter((_, index) => index !== 1);
    expect(next).toHaveLength(2);
    expect(next.map((column) => column.fieldName)).toEqual(['Name', 'Amount']);
  });

  it('reorders columns', () => {
    const columns = defaultDatatableColumns();
    const reordered = moveListItem(columns, 0, 2);
    expect(reordered.map((column) => column.fieldName)).toEqual(['Email', 'Amount', 'Name']);
  });

  it('shows currency typeAttributes only for currency columns', () => {
    const currencyFields = columnSchema().properties.filter((property) =>
      isPropertyVisible(property, { type: 'currency' })
    );
    const textFields = columnSchema().properties.filter((property) =>
      isPropertyVisible(property, { type: 'text' })
    );

    expect(currencyFields.some((property) => property.name === 'currencyCode')).toBe(true);
    expect(currencyFields.some((property) => property.name === 'linkify')).toBe(false);
    expect(textFields.some((property) => property.name === 'linkify')).toBe(true);
    expect(textFields.some((property) => property.name === 'currencyCode')).toBe(false);
  });

  it('hides sortable and editable for action columns and exposes rowActions', () => {
    const fields = columnSchema().properties.filter((property) =>
      isPropertyVisible(property, { type: 'action' })
    );
    const names = fields.map((property) => property.name);
    expect(names).not.toContain('sortable');
    expect(names).not.toContain('editable');
    expect(names).not.toContain('wrapText');
    expect(names).not.toContain('alignment');
    expect(names).toContain('menuAlignment');
    expect(names).toContain('rowActions');
    const rowActions = fields.find((property) => property.name === 'rowActions');
    expect(rowActions?.nestedObject).toBe('typeAttributes');
    expect(rowActions?.type).toBe('object-list');
    expect(rowActions?.required).toBe(true);
    expect(rowActions?.itemSchema?.minItems).toBe(1);
  });

  it('does not expose editable for date, date-local, or location columns', () => {
    expect(DATATABLE_NON_EDITABLE_TYPES).toEqual(
      expect.arrayContaining(['date', 'date-local', 'location'])
    );
    for (const type of ['date', 'date-local', 'location'] as const) {
      const names = columnSchema()
        .properties.filter((property) => isPropertyVisible(property, { type }))
        .map((property) => property.name);
      expect(names).not.toContain('editable');
    }
    const textNames = columnSchema()
      .properties.filter((property) => isPropertyVisible(property, { type: 'text' }))
      .map((property) => property.name);
    expect(textNames).toContain('editable');
  });

  it('exposes official column properties with type-appropriate visibility', () => {
    const textNames = columnSchema()
      .properties.filter((property) => isPropertyVisible(property, { type: 'text' }))
      .map((property) => property.name);
    expect(textNames).toEqual(
      expect.arrayContaining(['actions', 'hideLabel', 'iconName', 'imgSrc', 'displayReadOnlyIcon'])
    );

    const actionNames = columnSchema()
      .properties.filter((property) => isPropertyVisible(property, { type: 'action' }))
      .map((property) => property.name);
    expect(actionNames).toContain('hideLabel');
    expect(actionNames).toContain('actions');
    expect(actionNames).not.toContain('displayReadOnlyIcon');
    expect(actionNames).not.toContain('alignment');

    const editableText = columnSchema()
      .properties.filter((property) =>
        isPropertyVisible(property, { type: 'text', editable: true })
      )
      .map((property) => property.name);
    expect(editableText).not.toContain('displayReadOnlyIcon');
  });

  it('seeds required rowActions when a column becomes type action', () => {
    const seeded = seedRequiredVisibleDefaults({ type: 'action', label: 'A', fieldName: 'A' }, [
      columnSchema().properties.find((property) => property.name === 'rowActions')!,
    ]);
    expect(seeded.typeAttributes).toEqual(
      expect.objectContaining({
        rowActions: defaultDatatableRowActions(),
      })
    );
  });

  it('completes action columns with default rowActions and menuAlignment metadata', () => {
    const [column] = normalizeDatatableColumns([{ type: 'action', label: 'Actions', fieldName: 'unused' }]);
    expect(column?.typeAttributes?.rowActions).toEqual(defaultDatatableRowActions());
    const created = createDatatableColumn({ type: 'action', label: 'Row', fieldName: 'Row' });
    expect(created.typeAttributes?.rowActions).toEqual(defaultDatatableRowActions());
  });

  it('strips lcKey from Salesforce column objects used for future JS generation', () => {
    const salesforce = toSalesforceColumns([
      {
        lcKey: 'col-1',
        type: 'action',
        label: 'Actions',
        fieldName: 'unused',
        typeAttributes: {
          menuAlignment: 'left',
          rowActions: [
            { lcKey: 'act-1', label: 'Show details', name: 'show_details' },
            { lcKey: 'act-2', label: 'Delete', name: 'delete', disabled: true },
          ],
        },
        actions: [{ lcKey: 'hdr-1', label: 'All', name: 'all', checked: true }],
      },
    ]);
    expect(JSON.stringify(salesforce)).not.toContain('lcKey');
    expect(JSON.stringify(salesforce)).not.toContain('col-1');
    expect(salesforce[0]).toMatchObject({
      type: 'action',
      typeAttributes: {
        menuAlignment: 'left',
        rowActions: [
          { label: 'Show details', name: 'show_details' },
          { label: 'Delete', name: 'delete', disabled: true },
        ],
      },
      actions: [{ label: 'All', name: 'all', checked: true }],
    });
  });

  it('drops editable from date columns even if it was stored', () => {
    const [column] = normalizeDatatableColumns([
      { type: 'date', label: 'Close Date', fieldName: 'CloseDate', editable: true },
    ]);
    expect(column?.editable).toBeUndefined();
  });

  it('stores typeAttributes on a nested object', () => {
    const next = setObjectField(
      { type: 'url', label: 'Website', fieldName: 'Website' },
      { name: 'target', nestedObject: 'typeAttributes', label: 'Target', type: 'select' },
      '_blank'
    );
    expect(next.typeAttributes).toEqual({ target: '_blank' });
  });
});

describe('datatable design-time view', () => {
  it('builds sample rows from columns when data is empty', () => {
    const rows = createDatatableSampleRows(
      [{ label: 'Name', fieldName: 'Name', type: 'text' }],
      'Id'
    );
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({ Id: '1', Name: 'Sample 1' });
  });

  it('renders canvas/preview view model from configured properties', () => {
    const view = buildDatatableViewModel({
      'key-field': 'Id',
      columns: [
        { label: 'Name', fieldName: 'Name', type: 'text', sortable: true },
        { label: 'Amount', fieldName: 'Amount', type: 'currency' },
      ],
      'hide-checkbox-column': false,
      'show-row-number-column': true,
      'row-number-offset': 10,
      'is-loading': true,
      'sorted-by': 'Name',
      'sorted-direction': 'desc',
      'wrap-text-max-lines': 2,
    });

    expect(view.columns.map((column) => column.label)).toEqual(['Name', 'Amount']);
    expect(view.hideCheckboxColumn).toBe(false);
    expect(view.showRowNumberColumn).toBe(true);
    expect(view.rowNumberOffset).toBe(10);
    expect(view.isLoading).toBe(true);
    expect(view.sortedBy).toBe('Name');
    expect(view.sortedDirection).toBe('desc');
    expect(view.rows).toHaveLength(3);
    expect(view.columns[1]?.alignment).toBe('right');
  });

  it('centers action columns and ignores stored alignment', () => {
    const view = buildDatatableViewModel({
      columns: [
        {
          type: 'action',
          label: 'Actions',
          fieldName: 'unused',
          cellAttributes: { alignment: 'left' },
        },
      ],
    });
    expect(view.columns[0]?.alignment).toBe('center');
    expect(view.columns[0]?.typeAttributes.rowActions).toEqual(defaultDatatableRowActions());
  });

  it('does not assume USD when currencyCode is unset', () => {
    const formatted = formatDatatableCell(
      {
        key: 'amount',
        label: 'Amount',
        fieldName: 'Amount',
        type: 'currency',
        sortable: false,
        wrapText: false,
        alignment: 'right',
        typeAttributes: {},
      },
      1000
    );
    expect(formatted).not.toMatch(/USD/i);
    expect(formatted).not.toMatch(/\$/);
    expect(formatted).toMatch(/1[,.]?000/);
  });

  it('formats currency with an explicit currencyCode', () => {
    expect(
      formatDatatableCell(
        {
          key: 'amount',
          label: 'Amount',
          fieldName: 'Amount',
          type: 'currency',
          sortable: false,
          wrapText: false,
          alignment: 'right',
          typeAttributes: { currencyCode: 'EUR' },
        },
        1000
      )
    ).toMatch(/1,000/);
  });

  it('hides the header and borders together when configured', () => {
    const view = buildDatatableViewModel({
      'hide-table-header': true,
      'hide-borders': true,
      columns: [{ label: 'Name', fieldName: 'Name', type: 'text' }],
    });
    expect(view.hideTableHeader).toBe(true);
    expect(view.hideBorders).toBe(true);
  });

  it('does not hide borders unless the table header is hidden', () => {
    const view = buildDatatableViewModel({
      'hide-table-header': false,
      'hide-borders': true,
      columns: [{ label: 'Name', fieldName: 'Name', type: 'text' }],
    });
    expect(view.hideBorders).toBe(false);
  });

  it('formats currency and percent cells for preview', () => {
    expect(
      formatDatatableCell(
        {
          key: 'amount',
          label: 'Amount',
          fieldName: 'Amount',
          type: 'currency',
          sortable: false,
          wrapText: false,
          alignment: 'right',
          typeAttributes: { currencyCode: 'USD' },
        },
        1000
      )
    ).toMatch(/1,000/);
    expect(
      formatDatatableCell(
        {
          key: 'p',
          label: 'P',
          fieldName: 'P',
          type: 'percent',
          sortable: false,
          wrapText: false,
          alignment: 'right',
          typeAttributes: {},
        },
        0.2
      )
    ).toBe('20%');
  });
});

describe('datatable HTML generation', () => {
  it('emits Salesforce bindings instead of inlined arrays', () => {
    const node = createBuilderNode('lightning-datatable');
    const { html, errors } = generateLwcHtml([node]);
    expect(errors).toEqual([]);
    expect(html).toContain('<lightning-datatable');
    expect(html).toContain('key-field="Id"');
    expect(html).toContain('data={data}');
    expect(html).toContain('columns={columns}');
    expect(html).not.toContain('fieldName');
    expect(html).not.toContain('OpportunityName');
    expect(html).not.toContain('dnd-kit');
    expect(html).not.toContain('react');
  });

  it('omits false booleans and includes true Salesforce flags', () => {
    const node = createBuilderNode('lightning-datatable');
    node.attributes['hide-checkbox-column'] = true;
    node.attributes['show-row-number-column'] = true;
    node.attributes['is-loading'] = true;
    const { html } = generateLwcHtml([node]);
    expect(html).toContain('hide-checkbox-column');
    expect(html).toContain('show-row-number-column');
    expect(html).toContain('is-loading');
    expect(html).not.toContain('resize-column-disabled');
  });

  it('emits configured event handlers and omits empty ones', () => {
    const node = createBuilderNode('lightning-datatable');
    node.attributes.onsort = 'handleSort';
    node.attributes.onrowselection = 'handleRowSelection';
    const { html } = generateLwcHtml([node]);
    expect(html).toContain('onsort={handleSort}');
    expect(html).toContain('onrowselection={handleRowSelection}');
    expect(html).not.toContain('onloadmore=');
  });

  it('emits new official events and omits unconfigured JS bindings', () => {
    const node = createBuilderNode('lightning-datatable');
    node.attributes.onheaderaction = 'handleHeaderAction';
    node.attributes.onresize = 'handleResize';
    node.attributes['disabled-rows'] = 'disabledRows';
    node.attributes['draft-values'] = 'draftValues';
    node.attributes.errors = 'errors';
    node.attributes['show-actions-menu'] = true;
    node.attributes['resize-step'] = 10;
    node.attributes['aria-labelled-by'] = 'table-desc';
    node.attributes['aria-describedby'] = 'table-help';
    const { html } = generateLwcHtml([node]);
    expect(html).toContain('onheaderaction={handleHeaderAction}');
    expect(html).toContain('onresize={handleResize}');
    expect(html).toContain('disabled-rows={disabledRows}');
    expect(html).toContain('draft-values={draftValues}');
    expect(html).toContain('errors={errors}');
    expect(html).toContain('show-actions-menu');
    expect(html).toContain('resize-step="10"');
    expect(html).toContain('aria-labelled-by="table-desc"');
    expect(html).toContain('aria-describedby="table-help"');
  });

  it('does not inline rowActions, columns arrays, or draft objects in HTML', () => {
    const node = createBuilderNode('lightning-datatable');
    node.attributes.columns = [
      {
        type: 'action',
        label: 'Actions',
        fieldName: 'unused',
        typeAttributes: {
          rowActions: defaultDatatableRowActions(),
        },
      },
    ];
    node.attributes['draft-values'] = '';
    node.attributes.errors = '';
    node.attributes['disabled-rows'] = '';
    const { html } = generateLwcHtml([node]);
    expect(html).toContain('columns={columns}');
    expect(html).toContain('data={data}');
    expect(html).not.toContain('rowActions');
    expect(html).not.toContain('show_details');
    expect(html).not.toContain('draft-values=');
    expect(html).not.toContain('disabled-rows=');
    expect(html).not.toMatch(/errors=\{/);
  });

  it('rejects unsafe event handler identifiers', () => {
    const node = createBuilderNode('lightning-datatable');
    node.attributes.onsort = 'handleSort} alert(1)';
    const { html } = generateLwcHtml([node]);
    expect(html).not.toContain('alert');
    expect(html).not.toContain('onsort=');
  });

  it('reports a missing required key-field', () => {
    const node = createBuilderNode('lightning-datatable');
    node.attributes['key-field'] = '';
    const { errors } = generateLwcHtml([node]);
    expect(errors.some((error) => error.message.includes('key-field'))).toBe(true);
  });
});

describe('object-list helpers', () => {
  it('ignores non-object list values', () => {
    expect(asObjectList(null)).toEqual([]);
    expect(asObjectList([{ label: 'A' }, 2])).toEqual([{ label: 'A' }]);
  });

  it('seeds required nested defaults when a field becomes visible', () => {
    const rowActions = columnSchema().properties.find((property) => property.name === 'rowActions');
    expect(rowActions).toBeDefined();
    const textColumn = seedRequiredVisibleDefaults({ type: 'text' }, [rowActions!]);
    expect(textColumn.typeAttributes).toBeUndefined();
  });
});
