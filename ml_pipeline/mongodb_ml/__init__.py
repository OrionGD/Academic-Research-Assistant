"""
MongoDB ML Integration module for ARAS.
Provides advanced vector search, aggregation pipelines, and index optimization for ML workflows.
"""

from .vector_search import VectorSearch
from .aggregations import AggregationPipelines
from .indexes import IndexManager

__all__ = [
    'VectorSearch',
    'AggregationPipelines',
    'IndexManager',
]