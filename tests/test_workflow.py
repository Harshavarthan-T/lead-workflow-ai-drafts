import json
import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
W = json.loads((ROOT / 'workflows/lead-capture-ai-drafts.json').read_text())

class WorkflowTests(unittest.TestCase):
    def test_public_export_has_no_private_bindings(self):
        self.assertNotIn('id', W)
        self.assertFalse(W['active'])
        self.assertEqual(W['pinData'], {})
        for node in W['nodes']:
            self.assertNotIn('credentials', node)
            if node['type'] == 'n8n-nodes-base.googleSheets':
                self.assertEqual(node['parameters']['documentId']['value'], 'REPLACE_WITH_YOUR_SPREADSHEET_ID')

    def test_order_saves_before_ai_and_updates_same_id(self):
        path = ['On form submission', 'Prepare lead', 'Find contact by email', 'Resolve CRM contact', 'Save lead', 'Draft reply with AI', 'Prepare draft for review', 'Create Gmail review draft', 'Save draft on same lead']
        for start, end in zip(path, path[1:]):
            self.assertEqual(W['connections'][start]['main'][0][0]['node'], end)
        nodes = {n['name']: n for n in W['nodes']}
        self.assertEqual(nodes['Save lead']['parameters']['operation'], 'appendOrUpdate')
        update = nodes['Save draft on same lead']['parameters']
        self.assertEqual(update['operation'], 'update')
        self.assertEqual(update['columns']['matchingColumns'], ['crm_id'])
        self.assertEqual(set(update['columns']['value']), {'crm_id','status','ai_category','ai_subject','ai_draft'})
        for path in (ROOT / 'workflows').glob('*.json'):
            for n in json.loads(path.read_text())['nodes']:
                if n['type'] == 'n8n-nodes-base.gmail':
                    self.assertEqual((n['parameters']['resource'], n['parameters']['operation']), ('draft','create'))

    def test_ai_contract_and_review_status(self):
        nodes = {n['name']: n for n in W['nodes']}
        options = nodes['Draft reply with AI']['parameters']['options']
        schema = json.loads(options['textFormat']['textOptions']['schema'])
        self.assertEqual(set(schema['required']), {'ai_category','ai_subject','ai_draft'})
        fields = nodes['Prepare draft for review']['parameters']['assignments']['assignments']
        self.assertEqual(next(x['value'] for x in fields if x['name']=='status'), 'pending_review')
        self.assertEqual(W['settings']['timezone'], 'Europe/Berlin')

if __name__ == '__main__':
    unittest.main()
