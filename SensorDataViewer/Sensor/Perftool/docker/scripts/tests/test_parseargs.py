import json
import os

import pytest
from parseargs import get_perftool_params, setup_ss_cfg_yml


class TestPerftoolParams:
    def setup_method(self):
        os.environ.clear()

    def test_empty(self):
        ret = get_perftool_params()
        assert "perftool" in ret
        assert len(ret["perftool"]) == 0

    def test_param_str(self):
        os.environ["PERFTOOL_XXX"] = "text"
        ret = get_perftool_params()
        assert "perftool" in ret
        assert ret["perftool"]["xxx"] == "text"

    def test_param_int(self):
        os.environ["PERFTOOL_XXX"] = "31"
        ret = get_perftool_params()
        assert "perftool" in ret
        assert ret["perftool"]["xxx"] == 31

    def test_param_dict(self):
        os.environ["PERFTOOL_XXX__PARAM1"] = "31"
        ret = get_perftool_params()
        assert "perftool" in ret
        assert ret["perftool"]["xxx"] == dict(param1=31)


class TestSinetStreamConfigYml:
    def setup_method(self):
        os.environ.clear()

    @pytest.fixture
    def workdir(self, tmpdir):
        pwd = os.getcwd()
        os.chdir(tmpdir)
        yield tmpdir
        os.chdir(pwd)

    def test_empty(self, workdir):
        setup_ss_cfg_yml()
        cfg_path = workdir / ".sinetstream_config.yml"
        assert cfg_path.exists()
        cfg = json.loads(cfg_path.read())
        assert cfg == {}

    def test_target(self, workdir):
        os.environ["PERF_TGT_BROKERS"] = "mqtt.example.org"
        os.environ["PERF_TGT_TOPICS"] = "perftool-sinetstream-target"
        os.environ["PERF_TGT_TYPE"] = "mqtt"
        setup_ss_cfg_yml(
            [
                {
                    "name": "perf-target",
                    "env_prefix": "PERF_TGT_",
                }
            ]
        )
        cfg_path = workdir / ".sinetstream_config.yml"
        assert cfg_path.exists()
        cfg = json.loads(cfg_path.read())
        assert cfg == {
            "perf-target": dict(
                type="mqtt",
                brokers="mqtt.example.org",
                topics="perftool-sinetstream-target",
            ),
        }

    def test_result(self, workdir):
        os.environ["PERF_RST_BROKERS"] = "kafka.example.org"
        os.environ["PERF_RST_TOPICS"] = "perftool-sinetstream-result"
        setup_ss_cfg_yml(
            [
                {
                    "name": "perf-result",
                    "env_prefix": "PERF_RST_",
                }
            ]
        )
        cfg_path = workdir / ".sinetstream_config.yml"
        assert cfg_path.exists()
        cfg = json.loads(cfg_path.read())
        assert cfg == {
            "perf-result": dict(
                type="kafka",
                brokers="kafka.example.org",
                topics="perftool-sinetstream-result",
            ),
        }
