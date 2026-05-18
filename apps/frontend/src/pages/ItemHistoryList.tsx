import { useEffect, useState, useCallback } from 'react';
import { Table, Typography, Pagination, Modal, DatePicker, Space, message, Button } from 'antd';
import { EyeOutlined, SearchOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import Input from 'antd/es/input/Input';
import ItemDetails from '../components/ItemDetails';
import { useItemStore, type Item } from '../store/itemStore';
import { translateUnit } from '../utils/unitTranslator';

export default function ItemHistoryList() {
  const { t } = useTranslation();
  const { items, total, page, totalPages, loading, fetchItems } = useItemStore();
  const [search, setSearch] = useState('');
  const [detailItem, setDetailItem] = useState<Item | null>(null);
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);

  const loadItems = useCallback(
    (p?: number) => {
      const params: Record<string, string> = {
        page: String(p ?? 1),
        limit: '20',
        type: 'all',
      };
      if (search) params.search = search;
      fetchItems(params);
    },
    [search, fetchItems],
  );

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleSearch = (value: string) => {
    setSearch(value);
  };

  const handlePageChange = (newPage: number) => {
    loadItems(newPage);
  };

  const filtered = dateRange
    ? items.filter((item) => {
        const d = new Date(item.createdAt).getTime();
        const start = new Date(dateRange[0]).getTime();
        const end = new Date(dateRange[1]).getTime() + 86400000;
        return d >= start && d <= end;
      })
    : items;

  const columns = [
    { title: t('item.uniqueCode'), dataIndex: 'uniqueCode', key: 'code', width: 160 },
    { title: t('item.nameCn'), dataIndex: 'nameCn', key: 'nameCn' },
    { title: t('item.nameEn'), dataIndex: 'nameEn', key: 'nameEn' },
    {
      title: t('item.type'),
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => t(`item.${type}`),
    },
    {
      title: t('item.quantity'),
      key: 'quantity',
      width: 110,
      render: (_: unknown, r: Item) => {
        const en = translateUnit(r.unit);
        const u = en ? `${r.unit}/${en}` : r.unit;
        return u ? `${r.quantity ?? 1} ${u}` : String(r.quantity ?? 1);
      },
    },
    {
      title: t('item.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (d: string) => new Date(d).toLocaleDateString(),
    },
    {
      title: t('item.actions'),
      key: 'actions',
      width: 80,
      render: (_: unknown, record: Item) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => setDetailItem(record)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          {t('nav.itemsHistory')}
        </Typography.Title>
      </div>

      <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
        <Input
          prefix={<SearchOutlined />}
          placeholder={t('item.search')}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
          }}
          style={{ width: 300 }}
          allowClear
        />
        <DatePicker.RangePicker
          onChange={(dates) => {
            if (dates && dates[0] && dates[1]) {
              setDateRange([dates[0].format('YYYY-MM-DD'), dates[1].format('YYYY-MM-DD')]);
            } else {
              setDateRange(null);
            }
          }}
          placeholder={['Start Date', 'End Date']}
        />
      </div>

      <Table
        dataSource={filtered}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={false}
        scroll={{ x: 900 }}
      />

      {totalPages > 1 && (
        <div style={{ marginTop: 16, textAlign: 'right' }}>
          <Pagination
            current={page}
            total={total}
            pageSize={20}
            onChange={handlePageChange}
            showTotal={(t) => `Total ${t} items`}
          />
        </div>
      )}

      <Modal
        title={t('common.detail')}
        open={!!detailItem}
        onCancel={() => setDetailItem(null)}
        footer={null}
        width={700}
      >
        {detailItem && <ItemDetails item={detailItem} />}
      </Modal>
    </div>
  );
}
