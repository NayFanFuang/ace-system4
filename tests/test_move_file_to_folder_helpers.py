import importlib.util
import tempfile
import unittest
from pathlib import Path


MODULE_PATH = Path(r"C:\MyProjects\0_Me\MoveFileToFolder\MoveFileToFolder.py")


def load_module():
    spec = importlib.util.spec_from_file_location("move_file_to_folder", MODULE_PATH)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class MoveFileToFolderHelperTests(unittest.TestCase):
    def test_parse_requested_names_trims_blanks_and_preserves_order(self):
        module = load_module()

        names = module.parse_requested_names("  one.pdf\n\nTwo.xlsx  \n one.pdf ")

        self.assertEqual(names, ["one.pdf", "Two.xlsx", "one.pdf"])

    def test_build_file_index_finds_nested_files_case_insensitively(self):
        module = load_module()
        with tempfile.TemporaryDirectory() as temp_dir:
            source = Path(temp_dir) / "source"
            nested = source / "Nested"
            nested.mkdir(parents=True)
            (source / "Report.PDF").write_text("root", encoding="utf-8")
            (nested / "report.pdf").write_text("nested", encoding="utf-8")

            index = module.build_file_index(source)

            self.assertIn("report.pdf", index)
            self.assertEqual(len(index["report.pdf"]), 2)
            self.assertTrue(all(path.name.lower() == "report.pdf" for path in index["report.pdf"]))

    def test_unique_destination_path_avoids_overwrite(self):
        module = load_module()
        with tempfile.TemporaryDirectory() as temp_dir:
            destination = Path(temp_dir) / "destination"
            destination.mkdir()
            (destination / "invoice.pdf").write_text("existing", encoding="utf-8")
            (destination / "invoice (1).pdf").write_text("existing", encoding="utf-8")

            unique_path = module.unique_destination_path(destination, "invoice.pdf")

            self.assertEqual(unique_path, destination / "invoice (2).pdf")


if __name__ == "__main__":
    unittest.main()
